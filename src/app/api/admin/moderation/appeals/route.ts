import { NextRequest, NextResponse } from "next/server";
import { requestSecurityMetadata, requireAdminPermission } from "@/lib/auth/adminApi";
import { getServerSupabase } from "@/lib/supabase/server";
import { APPEAL_OUTCOMES, appealNotice } from "@/lib/moderation/outcomes.mjs";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * FM-07: decides the open appeal on a case (DSA Art. 20). The member-facing explanation goes to
 * whoever appealed; the internal reason stays in the moderation history and audit log.
 * Reversing an account action (e.g. lifting a suspension) is still done in Admin → Users.
 */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdminPermission(req, "moderation:decide");
  if ("response" in auth) return auth.response;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const caseId = typeof body.caseId === "string" ? body.caseId : "";
  const outcome = typeof body.outcome === "string" ? body.outcome : "";
  const memberStatement = typeof body.memberStatement === "string" ? body.memberStatement.replace(/\s+/g, " ").trim().slice(0, 2000) : "";
  const internalReason = typeof body.internalReason === "string" ? body.internalReason.trim().slice(0, 4000) : "";
  if (!UUID.test(caseId) || !APPEAL_OUTCOMES.includes(outcome)) return NextResponse.json({ error: "Choose an appeal outcome" }, { status: 400 });
  if (memberStatement.length < 20) return NextResponse.json({ error: "Explain the outcome to the member in at least 20 characters" }, { status: 400 });
  if (internalReason.length < 10) return NextResponse.json({ error: "Record the internal reason (at least 10 characters)" }, { status: 400 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Moderation service unavailable" }, { status: 503 });

  const { data: before } = await db.from("moderation_cases").select("id,status,priority,assigned_moderator").eq("id", caseId).maybeSingle();
  if (!before) return NextResponse.json({ error: "Moderation case not found" }, { status: 404 });
  if (before.status !== "APPEALED") return NextResponse.json({ error: "This case has no open appeal" }, { status: 409 });
  if (before.priority === "CRITICAL") {
    const critical = await requireAdminPermission(req, "moderation:critical");
    if ("response" in critical) return critical.response;
  }
  const { data, error } = await db.rpc("intimo_decide_appeal", { p_case_id: caseId, p_reviewer_id: auth.actor.profileId, p_outcome: outcome, p_member_statement: memberStatement, p_internal_reason: internalReason });
  if (error || !data) return NextResponse.json({ error: error?.message?.includes("appeal_not_open") ? "This case has no open appeal" : "The appeal decision could not be saved" }, { status: error?.message?.includes("appeal_not_open") ? 409 : 502 });
  const result = data as { appeal_id: string; appellant_id: string; outcome: string; case_status: string };
  // Ideally a different person reviews the appeal; with a small team that isn't always possible, so it's recorded.
  const sameReviewer = before.assigned_moderator === auth.actor.profileId;
  const { error: auditError } = await db.from("admin_action_events").insert({ actor_profile_id: auth.actor.profileId, actor_role: auth.actor.role, action: "MODERATION_APPEAL_DECISION", category: before.priority === "CRITICAL" ? "CRITICAL_SAFETY" : "MODERATION", resource_type: "MODERATION_CASE", resource_id: caseId, reason: internalReason, previous_state: { status: "APPEALED" }, new_state: { status: result.case_status, appealOutcome: outcome, sameReviewerAsDecision: sameReviewer }, security_metadata: requestSecurityMetadata(req) });
  if (auditError) return NextResponse.json({ error: "Appeal decided, but the audit could not be recorded; escalate immediately" }, { status: 502 });
  const notice = appealNotice(outcome);
  const { error: noticeError } = notice ? await db.from("notifications").insert({ user_id: result.appellant_id, type: "APPEAL_OUTCOME", title: notice.title, message: notice.message, target_link: "/settings#reports", is_read: false }) : { error: null };
  return NextResponse.json({ appeal: result, sameReviewer, ...(noticeError ? { notificationWarning: "Appeal decided, but the member could not be notified. Tell them another way." } : {}) });
}
