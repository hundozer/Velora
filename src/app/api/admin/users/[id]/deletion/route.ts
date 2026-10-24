import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission, requestSecurityMetadata } from '@/lib/auth/adminApi';
import { adminSessionFresh } from '@/lib/auth/adminAuthorization';
import { getServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const headers = { 'Cache-Control': 'private, no-store' };

/** Starts the existing privacy lifecycle. Never hard-deletes the profile row. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdminPermission(req, 'privacy:process');
  if ('response' in auth) return auth.response;
  if (!UUID.test(params.id)) return NextResponse.json({ error: 'Invalid member ID' }, { status: 400, headers });
  if (params.id.toLowerCase() === auth.actor.profileId.toLowerCase()) return NextResponse.json({ error: 'Use account settings to delete your own account.' }, { status: 403, headers });
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers }); }
  const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 1000) : '';
  if (reason.length < 5 || body?.confirmation !== `DELETE ${params.id}`) return NextResponse.json({ code: 'CONFIRMATION_REQUIRED', error: 'Enter an auditable reason and type DELETE followed by the exact member ID.' }, { status: 400, headers });
  if (!adminSessionFresh(auth.actor)) return NextResponse.json({ code: 'RECENT_AUTH_REQUIRED', error: 'Sign in again, complete MFA if prompted, then review and submit the deletion again. A sign-in within the last 30 minutes is required.' }, { status: 409, headers });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: 'Deletion service unavailable' }, { status: 503, headers });

  const { data: member, error: memberError } = await db.from('profiles').select('id,auth_id,account_status,account_lifecycle_status,deletion_requested_at,deactivated_at').eq('id', params.id).maybeSingle();
  if (memberError) return NextResponse.json({ error: 'Member lookup failed' }, { status: 503, headers });
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404, headers });
  if (member.auth_id !== member.id) return NextResponse.json({ error: 'Legacy identity requires a reviewed privacy procedure. No records were changed.' }, { status: 409, headers });
  if (['DELETED', 'ANONYMIZATION_IN_PROGRESS', 'RETENTION_HOLD_IF_REQUIRED'].includes(member.account_lifecycle_status)) return NextResponse.json({ error: 'This account is already in the retention process. Review its privacy record.' }, { status: 409, headers });

  const { data: assignment, error: assignmentError } = await db.from('admin_assignments').select('id').eq('profile_id', member.id).in('status', ['ACTIVE', 'SUSPENDED']).limit(1).maybeSingle();
  if (assignmentError) return NextResponse.json({ error: 'Administrator access could not be checked' }, { status: 503, headers });
  const bootstrapIds = (process.env.INTIMO_ADMIN_USER_IDS || '').split(',').map(value => value.trim());
  const bootstrapRoles = (process.env.INTIMO_ADMIN_ROLE_ASSIGNMENTS || '').split(',').map(value => value.trim().split('=')[0]);
  if (assignment || bootstrapIds.includes(member.auth_id) || bootstrapRoles.includes(member.auth_id)) return NextResponse.json({ error: 'Revoke this account’s administrator access before deleting it.' }, { status: 409, headers });

  const requestedAt = member.deletion_requested_at || new Date().toISOString();
  const audit = async (action: string, state: Record<string, unknown>) => db.from('admin_action_events').insert({
    actor_profile_id: auth.actor.profileId, actor_role: auth.actor.role, action, category: 'PRIVACY_DELETION',
    resource_type: 'USER', resource_id: member.id, reason,
    previous_state: { account_status: member.account_status, account_lifecycle_status: member.account_lifecycle_status },
    new_state: state, security_metadata: requestSecurityMetadata(req),
  });
  const { error: intentError } = await audit('ADMIN_USER_DELETION_REQUESTED', { account_lifecycle_status: 'DELETION_REQUESTED', hardDeletionPending: true });
  if (intentError) return NextResponse.json({ error: 'Deletion audit could not be recorded. No account changes were made.' }, { status: 503, headers });

  const incomplete = (phase: string) => NextResponse.json({ code: 'DELETION_INCOMPLETE', error: `${phase}. Deletion may be incomplete. Refresh the member and privacy records before retrying; do not reactivate the account.` }, { status: 502, headers });
  try {
    const { data: existing, error: requestLookupError } = await db.from('privacy_requests').select('id').eq('profile_id', member.id).eq('request_type', 'DELETION').in('status', ['OPEN', 'IDENTITY_CONFIRMATION_REQUIRED', 'IN_PROGRESS', 'LEGAL_REVIEW']).order('requested_at', { ascending: false }).limit(1).maybeSingle();
    if (requestLookupError) return incomplete('Privacy request lookup failed');
    let requestId = existing?.id;
    if (!requestId) {
      // Stable ID plus primary-key conflict handling keeps concurrent starts
      // from creating duplicate admin requests, without overwriting history.
      const { error } = await db.from('privacy_requests').upsert({ id: member.id, profile_id: member.id, request_type: 'DELETION', status: 'IN_PROGRESS', requested_at: requestedAt, assigned_admin_id: auth.actor.profileId, notes: `Administrator-initiated deletion: ${reason}` }, { onConflict: 'id', ignoreDuplicates: true });
      const { data: request, error: verificationError } = await db.from('privacy_requests').select('id,status').eq('id', member.id).eq('profile_id', member.id).eq('request_type', 'DELETION').maybeSingle();
      if (error || verificationError || !request || !['OPEN', 'IDENTITY_CONFIRMATION_REQUIRED', 'IN_PROGRESS', 'LEGAL_REVIEW'].includes(request.status)) return incomplete('Privacy request could not be recorded or requires operator review');
      requestId = request.id;
    }

    const { data: restricted, error: restrictionError } = await db.from('profiles').update({
      account_status: 'DELETION_REQUESTED', account_lifecycle_status: 'DELETION_REQUESTED', deletion_requested_at: requestedAt,
      public_profile_visibility: false, profile_visibility: 'PRIVATE', allow_direct_messages: false,
      discovery_disabled: true, messaging_disabled: true, media_uploads_disabled: true, updated_at: new Date().toISOString(),
    }).eq('id', member.id).eq('auth_id', member.auth_id).eq('account_lifecycle_status', member.account_lifecycle_status).select('id').maybeSingle();
    if (restrictionError || !restricted) return incomplete('Access restriction failed or the account changed during review');

    // Existing JWTs must also meet active-profile checks. Removing Auth alone
    // is not treated as immediate invalidation of every issued token.
    const { error: authError } = await db.auth.admin.deleteUser(member.auth_id);
    if (authError && authError.status !== 404) return incomplete('Login deletion failed; the profile remains restricted');
    const deactivatedAt = member.deactivated_at || new Date().toISOString();
    const { data: deactivated, error: deactivationError } = await db.from('profiles').update({ account_status: 'DEACTIVATED', account_lifecycle_status: 'DEACTIVATED', deactivated_at: deactivatedAt, updated_at: new Date().toISOString() }).eq('id', member.id).eq('account_lifecycle_status', 'DELETION_REQUESTED').select('id').maybeSingle();
    if (deactivationError || !deactivated) return incomplete('Login removed but final lifecycle update failed');
    const { error: completionAuditError } = await audit('ADMIN_USER_ACCESS_REMOVED', { account_lifecycle_status: 'DEACTIVATED', privacyRequestId: requestId, hardDeletionPending: true });
    if (completionAuditError) return incomplete('Access removed but the completion audit failed');
    return NextResponse.json({ message: 'User access disabled and login removed. Final erasure is pending the retention process, subject to legal holds.', privacyRequestId: requestId, lifecycleStatus: 'DEACTIVATED', hardDeletionPending: true, erasureEligibleAt: new Date(Date.parse(deactivatedAt) + 30 * 86400000).toISOString() }, { status: 202, headers });
  } catch { return incomplete('Deletion service failed'); }
}
