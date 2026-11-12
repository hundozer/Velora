import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/adminApi";
import { appendDurableAudit } from "@/lib/auth/durableAudit";
import { getServerSupabase } from "@/lib/supabase/server";
import { ResendClient } from "@/lib/notifications/resendClient";
import { approvedInvitationEmail, BASED_IN, IDENTITIES } from "@/lib/invitations/requests";

// Admin review of public invitation requests. Approval issues a normal single-use
// member invitation (member_email_invites) bound to the requester's address.
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PERMISSION = "users:view_sensitive" as const;

export async function GET(req: NextRequest) {
  const guard = await requireAdminPermission(req, PERMISSION);
  if ("response" in guard) return guard.response;
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Requests unavailable" }, { status: 503, headers: noStore });
  const columns = "id,email,identity,based_in,intent,language,status,created_at,decided_at";
  const [pending, decided] = await Promise.all([
    db.from("invitation_requests").select(columns).eq("status", "PENDING").order("created_at", { ascending: true }).limit(200),
    db.from("invitation_requests").select(columns).neq("status", "PENDING").order("decided_at", { ascending: false }).limit(30),
  ]);
  if (pending.error || decided.error) return NextResponse.json({ error: "Requests lookup failed" }, { status: 502, headers: noStore });
  const shape = (row: Record<string, string | null>) => ({
    id: row.id, email: row.email, status: row.status, createdAt: row.created_at, decidedAt: row.decided_at, intent: row.intent, language: row.language,
    identity: IDENTITIES[row.identity as keyof typeof IDENTITIES] ?? row.identity, basedIn: BASED_IN[row.based_in as keyof typeof BASED_IN] ?? row.based_in,
  });
  return NextResponse.json({ pending: (pending.data ?? []).map(shape), decided: (decided.data ?? []).map(shape) }, { headers: noStore });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdminPermission(req, PERMISSION);
  if ("response" in guard) return guard.response;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400, headers: noStore }); }
  const id = typeof body.id === "string" ? body.id : "";
  const decision = body.decision === "APPROVED" || body.decision === "REJECTED" ? body.decision : null;
  if (!UUID.test(id) || !decision) return NextResponse.json({ error: "Invalid decision" }, { status: 400, headers: noStore });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Requests unavailable" }, { status: 503, headers: noStore });
  const admin = guard.actor.profileId;
  const audit = (action: string, metadata: Record<string, unknown> = {}) => appendDurableAudit(db, { actorProfileId: admin, actorUserId: guard.actor.userId, action, resourceType: "INVITATION_REQUEST", resourceId: id, outcome: "SUCCESS", metadata });

  if (decision === "REJECTED") {
    // Nothing is sent to the requester. Their address is cleared once decided.
    const { data, error } = await db.from("invitation_requests")
      .update({ status: "REJECTED", email: null, decided_at: new Date().toISOString(), decided_by: admin })
      .eq("id", id).eq("status", "PENDING").select("id").maybeSingle();
    if (error) return NextResponse.json({ error: "Decision could not be saved" }, { status: 502, headers: noStore });
    if (!data) return NextResponse.json({ error: "This request was already decided" }, { status: 409, headers: noStore });
    if (!(await audit("INVITATION_REQUEST_REJECT"))) return NextResponse.json({ error: "Decision saved but audit evidence failed" }, { status: 502, headers: noStore });
    return NextResponse.json({ id, status: "REJECTED" }, { headers: noStore });
  }

  const { data: request, error: readError } = await db.from("invitation_requests").select("email,language").eq("id", id).eq("status", "PENDING").maybeSingle();
  if (readError) return NextResponse.json({ error: "Request lookup failed" }, { status: 502, headers: noStore });
  if (!request?.email) return NextResponse.json({ error: "This request was already decided" }, { status: 409, headers: noStore });
  const token = randomBytes(32).toString("base64url");
  const { data: inviteId, error: claimError } = await db.rpc("approve_invitation_request", {
    p_request: id, p_admin: admin, p_token_hash: createHash("sha256").update(token).digest("hex"),
  });
  if (claimError || !inviteId) {
    const message = claimError?.message || "";
    if (message.includes("not pending")) return NextResponse.json({ error: "This request was already decided" }, { status: 409, headers: noStore });
    if (message.includes("recent invitation")) return NextResponse.json({ error: "This address already received an invitation in the last 30 days" }, { status: 409, headers: noStore });
    return NextResponse.json({ error: "Invitation could not be created" }, { status: 503, headers: noStore });
  }
  const email = approvedInvitationEmail(token, request.language === "cs" ? "cs" : "en");
  let sent: Awaited<ReturnType<typeof ResendClient.sendEmail>> | null = null;
  try { sent = await ResendClient.sendEmail({ to: request.email, subject: email.subject, html: email.html }); } catch { sent = null; }
  if (!sent?.delivered || sent.provider !== "RESEND_API") {
    // Undo so the request can be approved again later; the token is never usable.
    await db.from("member_email_invites").update({ status: "FAILED" }).eq("id", inviteId);
    await db.from("invitation_requests").update({ status: "PENDING", decided_at: null, decided_by: null, invite_id: null }).eq("id", id);
    return NextResponse.json({ error: "The invitation email could not be sent. The request is still pending; try again later." }, { status: 502, headers: noStore });
  }
  const [{ error: inviteError }, { error: clearError }] = await Promise.all([
    db.from("member_email_invites").update({ status: "SENT", sent_at: new Date().toISOString(), provider_message_id: sent.id }).eq("id", inviteId),
    db.from("invitation_requests").update({ email: null }).eq("id", id),
  ]);
  const audited = await audit("INVITATION_REQUEST_APPROVE", { inviteId });
  if (inviteError || clearError || !audited) return NextResponse.json({ error: "Invitation sent, but tracking failed. Do not approve again." }, { status: 502, headers: noStore });
  return NextResponse.json({ id, status: "APPROVED" }, { headers: noStore });
}
