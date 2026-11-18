import { NextRequest, NextResponse } from "next/server";
import { requestSecurityMetadata, requireAdminPermission } from "@/lib/auth/adminApi";
import { getServerSupabase } from "@/lib/supabase/server";
import { isMissingColumnError } from "@/lib/identity.mjs";
import { AFFECTED_NOTICE, cleanDecision, dueAt, isOverdue, reporterNotice } from "@/lib/moderation/outcomes.mjs";

export const dynamic = "force-dynamic";
const STATUSES = new Set(["OPEN","UNDER_REVIEW","ACTION_REQUIRED","RESOLVED","REJECTED","APPEALED","ESCALATED"]);

export async function GET(req: NextRequest) {
  const auth = await requireAdminPermission(req, "moderation:view");
  if ("response" in auth) return auth.response;
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Moderation service unavailable" }, { status: 503 });
  let query = supabase.from("moderation_cases").select("*");
  if (req.nextUrl.searchParams.get("queue") === "1") query = query.in("status", ["OPEN", "UNDER_REVIEW", "ACTION_REQUIRED", "ESCALATED", "APPEALED"]);
  const { data, error } = await query.order("priority", { ascending: true }).order("created_at", { ascending: true }).limit(500);
  if (error) return NextResponse.json({ error: "Moderation queue lookup failed" }, { status: 502 });
  const cases = (data || []) as Array<Record<string, any>>;
  // FM-07: open appeals travel with their case so the reviewer reads both sides.
  const appealed = cases.filter((row) => row.status === "APPEALED").map((row) => row.id);
  const { data: appeals, error: appealError } = appealed.length ? await supabase.from("moderation_appeals").select("id,case_id,appellant_id,reason,status,created_at").in("case_id", appealed).in("status", ["OPEN", "UNDER_REVIEW"]) : { data: [], error: null };
  if (appealError) return NextResponse.json({ error: "Moderation queue lookup failed" }, { status: 502 });
  const appealByCase = new Map((appeals || []).map((row) => [row.case_id, row]));
  const now = Date.now();
  return NextResponse.json({ cases: cases.map((row) => {
    const appeal = appealByCase.get(row.id);
    return { ...row, due_at: dueAt(row), overdue: isOverdue(row, now), appeal: appeal ? { ...appeal, by: appeal.appellant_id === row.reporter_id ? "REPORTER" : "REPORTED_MEMBER" } : null };
  }) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminPermission(req, "moderation:decide");
  if ("response" in auth) return auth.response;
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const id = typeof body.id === "string" ? body.id : "";
  const status = typeof body.status === "string" ? body.status : "";
  const decision = typeof body.decision === "string" ? body.decision.trim().slice(0, 200) : null;
  const decisionReason = typeof body.decisionReason === "string" ? body.decisionReason.trim().slice(0, 4_000) : null;
  if (!id || !STATUSES.has(status) || status === "APPEALED" || (["RESOLVED","REJECTED"].includes(status) && (!decision || !decisionReason))) return NextResponse.json({ error: "Invalid moderation decision" }, { status: 400 });
  // FM-07: a final decision also records what was done and, when action was taken, a statement
  // of reasons written for the reported member.
  const outcome = cleanDecision(status, body);
  if (outcome.error) return NextResponse.json({ error: outcome.error }, { status: 400 });
  const now = new Date().toISOString();
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Moderation service unavailable" }, { status: 503 });
  const { data: before } = await supabase.from("moderation_cases").select("id,status,priority,reporter_id,reported_user_id").eq("id", id).maybeSingle();
  if (!before) return NextResponse.json({ error: "Moderation case not found" }, { status: 404 });
  if (before.status === "APPEALED") return NextResponse.json({ error: "This case is under appeal. Decide the appeal instead." }, { status: 409 });
  if (["RESOLVED", "REJECTED"].includes(before.status) && ["RESOLVED", "REJECTED"].includes(status)) return NextResponse.json({ error: "This case is already decided. A change goes through an appeal." }, { status: 409 });
  if (before.priority === "CRITICAL") {
    const critical = await requireAdminPermission(req, "moderation:critical");
    if ("response" in critical) return critical.response;
  }
  const { data, error } = await supabase.from("moderation_cases").update({ status, assigned_moderator: auth.actor.profileId, decision, decision_reason: decisionReason, decision_timestamp: ["RESOLVED","REJECTED"].includes(status) ? now : null, ...outcome.value, updated_at: now }).eq("id", id).eq("status", before.status).select("*").single();
  if (isMissingColumnError(error)) return NextResponse.json({ error: "Report outcomes need database migration 20261118180000_report_outcomes.sql" }, { status: 503 });
  if (error || !data) return NextResponse.json({ error: "Moderation case update failed. Refresh and try again." }, { status: 502 });
  const { error: eventError } = await supabase.from("moderation_events").insert({ case_id: id, actor_profile_id: auth.actor.profileId, action: decision ? "DECISION_RECORDED" : "STATUS_CHANGED", from_status: before.status, to_status: status, reason: decisionReason });
  if (eventError) return NextResponse.json({ error: "Moderation history could not be recorded" }, { status: 502 });
  const { error: auditError } = await supabase.from("admin_action_events").insert({ actor_profile_id: auth.actor.profileId, actor_role: auth.actor.role, action: "MODERATION_CASE_UPDATE", category: before.priority === "CRITICAL" ? "CRITICAL_SAFETY" : "MODERATION", resource_type: "MODERATION_CASE", resource_id: id, reason: decisionReason || `Status changed to ${status}`, previous_state: { status: before.status }, new_state: { status, decision }, security_metadata: requestSecurityMetadata(req) });
  if (auditError) return NextResponse.json({ error: "Moderation audit could not be recorded" }, { status: 502 });
  const notificationWarning = ["RESOLVED", "REJECTED"].includes(status) ? await notifyParties(supabase, before, status, data.action_taken) : null;
  return NextResponse.json({ case: data, ...(notificationWarning ? { notificationWarning } : {}) });
}

/**
 * FM-07: the reporter hears the outcome; the reported member hears only when action was taken.
 * The decision stands even if a notice fails: the admin is told so they can follow up.
 */
async function notifyParties(supabase: NonNullable<ReturnType<typeof getServerSupabase>>, before: { id: string; reporter_id: string | null; reported_user_id: string | null }, status: string, action: string | null) {
  const rows = [];
  const notice = reporterNotice(status);
  if (before.reporter_id && notice) rows.push({ user_id: before.reporter_id, type: "REPORT_OUTCOME", title: notice.title, message: notice.message, target_link: "/settings#reports", is_read: false });
  const affected = Boolean(before.reported_user_id && action && action !== "NO_ACTION");
  if (affected) rows.push({ user_id: before.reported_user_id, type: "MODERATION_DECISION", title: AFFECTED_NOTICE.title, message: AFFECTED_NOTICE.message, target_link: "/settings#decisions", is_read: false });
  if (!rows.length) return null;
  const { error } = await supabase.from("notifications").insert(rows);
  if (error) return "Decision saved, but the members could not be notified. Tell them another way.";
  const stamp = new Date().toISOString();
  await supabase.from("moderation_cases").update({ ...(before.reporter_id && notice ? { reporter_notified_at: stamp } : {}), ...(affected ? { affected_notified_at: stamp } : {}) }).eq("id", before.id);
  return null;
}
