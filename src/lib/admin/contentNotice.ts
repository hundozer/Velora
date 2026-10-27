import type { SupabaseClient } from '@supabase/supabase-js';
/** Only call after an audited decision. Delivers an in-app notice, never email. */
export async function contentDecisionNotice(db: SupabaseClient, input: { requested: boolean; ownerId: string; kind: 'album' | 'photo' | 'video'; decision: string; requestChanges: boolean; reason: string }) {
  if (!input.requested) return { notificationSent: false };
  const outcome = input.requestChanges ? 'needs changes' : input.decision === 'APPROVED' ? 'was approved' : input.decision === 'REJECTED' ? 'was rejected' : input.decision === 'REMOVED' ? 'was removed' : input.decision === 'HIDDEN' ? 'was hidden' : 'is under review';
  const nextStep = input.kind === 'album' ? 'Edit and save your album for another review.' : input.kind === 'video' ? 'Review the feedback before uploading a new video.' : 'Replace this photo or exclude it from your album, then save the album for another review.';
  const { error } = await db.from('notifications').insert({ user_id: input.ownerId, type: 'CONTENT_REVIEW', title: `Your ${input.kind} ${outcome}`, message: input.requestChanges ? `${input.reason}\n${nextStep}` : input.reason, actor_name: 'Intimo moderation', actor_avatar: null, target_link: input.kind === 'video' ? '/videos' : '/albums/manage', is_read: false });
  return error ? { notificationSent: false, notificationWarning: 'Decision saved, but the in-app notice could not be delivered. Do not repeat the decision to retry the notice.' } : { notificationSent: true };
}
