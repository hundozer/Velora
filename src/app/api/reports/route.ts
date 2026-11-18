import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { auditLogger } from "@/lib/auth/auditLogger";
import { isMissingColumnError } from "@/lib/identity.mjs";
import { affectedMemberMaySee, mayAppeal, reporterState } from "@/lib/moderation/outcomes.mjs";
import { notifySafetyTeam } from "@/lib/notifications/safetyAlert";

export const dynamic = "force-dynamic";
const TYPES = new Set(["PROFILE","PHOTO","ALBUM","VIDEO","MESSAGE","POST","COMMENT","COMMUNITY","EVENT","LIVESTREAM"]);
const REASONS = new Set(["SUSPECTED_MINOR","NON_CONSENSUAL_INTIMATE_CONTENT","HARASSMENT","THREATS","IMPERSONATION","SCAM_FRAUD","ILLEGAL_CONTENT","EXPLOITATION_TRAFFICKING","COPYRIGHT_INFRINGEMENT","PRIVACY_VIOLATION","PROHIBITED_COMMERCIAL_SEXUAL_SERVICES","SPAM","OTHER"]);
const CRITICAL = new Set(["SUSPECTED_MINOR","NON_CONSENSUAL_INTIMATE_CONTENT","EXPLOITATION_TRAFFICKING"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CASE_COLUMNS = "id,reporter_id,reported_user_id,content_type,reason,status,priority,decision_timestamp,appeal_status,created_at";

/**
 * FM-07: a member's own reports (outcome only) and the decisions taken about them (a statement
 * of reasons). Open or dismissed reports about a member are never shown to them, and nobody
 * learns who reported them.
 */
export async function GET(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Reporting service unavailable" }, { status: 503 });
  const me = actor.actor.profileId;
  const list = (columns: string) => supabase.from("moderation_cases").select(columns).or(`reporter_id.eq.${me},reported_user_id.eq.${me}`).order("created_at", { ascending: false }).limit(200);
  let result = await list(`${CASE_COLUMNS},action_taken,policy_ground,member_statement`);
  // Before the FM-07 migration no statements exist, so nothing is shown to the reported member.
  if (isMissingColumnError(result.error)) result = await list(CASE_COLUMNS);
  if (result.error) return NextResponse.json({ error: "Report history lookup failed" }, { status: 502 });
  const rows = (result.data || []) as unknown as Array<Record<string, any>>;
  const { data: appeals, error: appealError } = await supabase.from("moderation_appeals").select("case_id,status,decision_reason,created_at,decided_at").eq("appellant_id", me);
  if (appealError) return NextResponse.json({ error: "Report history lookup failed" }, { status: 502 });
  const myAppeal = new Map((appeals || []).map((row) => [row.case_id, { status: row.status, explanation: row.decided_at ? row.decision_reason : null, submittedAt: row.created_at, decidedAt: row.decided_at }]));
  const reports = rows.filter((row) => row.reporter_id === me).map((row) => ({
    id: row.id, relationship: "REPORTER", contentType: row.content_type, reason: row.reason, createdAt: row.created_at,
    state: reporterState(row), mayAppeal: mayAppeal(row, me), appeal: myAppeal.get(row.id) || null,
  }));
  const decisions = rows.filter((row) => row.reported_user_id === me && affectedMemberMaySee(row)).map((row) => ({
    id: row.id, relationship: "AFFECTED_USER", contentType: row.content_type, decidedAt: row.decision_timestamp,
    action: row.action_taken, ground: row.policy_ground, statement: row.member_statement, automated: false,
    mayAppeal: mayAppeal(row, me), appeal: myAppeal.get(row.id) || null,
  }));
  return NextResponse.json({ reports, decisions }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  const rate = (await checkRateLimit(`report:${actor.actor.userId}`, 15, 24 * 60 * 60));
  if (!rate.allowed) return NextResponse.json({ error: "Report limit reached; contact support for urgent safety concerns" }, { status: 429 });
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const contentType = typeof body.contentType === "string" ? body.contentType : "";
  const reason = typeof body.reason === "string" ? body.reason : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const reportedUserId = typeof body.reportedUserId === "string" ? body.reportedUserId : null;
  const contentId = typeof body.contentId === "string" ? body.contentId.trim().slice(0, 200) : null;
  if (!TYPES.has(contentType) || !REASONS.has(reason) || description.length < 10 || description.length > 4_000) return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  if (reportedUserId && (!UUID.test(reportedUserId) || reportedUserId === actor.actor.profileId)) return NextResponse.json({ error: "Invalid reported user" }, { status: 400 });
  const priority = CRITICAL.has(reason) ? "CRITICAL" : reason === "THREATS" || reason === "ILLEGAL_CONTENT" ? "HIGH" : "STANDARD";
  const status = priority === "CRITICAL" ? "ESCALATED" : "OPEN";
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Reporting service unavailable" }, { status: 503 });
  const duplicateSince = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  let duplicateQuery = supabase.from("moderation_cases").select("id").eq("reporter_id", actor.actor.profileId).eq("content_type", contentType).eq("reason", reason).gte("created_at", duplicateSince);
  duplicateQuery = contentId ? duplicateQuery.eq("content_id", contentId) : duplicateQuery.is("content_id", null);
  const { data: duplicate } = await duplicateQuery.limit(1).maybeSingle();
  if (duplicate) return NextResponse.json({ error: "You already reported this item for the same reason recently", reportId: duplicate.id }, { status: 409 });
  const { data, error } = await supabase.rpc("intimo_create_report", { p_reporter_id: actor.actor.profileId, p_reported_user_id: reportedUserId, p_content_type: contentType, p_content_id: contentId, p_reason: reason, p_description: description, p_priority: priority, p_status: status });
  if (error || !data) return NextResponse.json({ error: "Report submission failed" }, { status: 502 });
  auditLogger.logEvent({ actorId: actor.actor.userId, actorRole: actor.actor.role as any, action: "REPORT_CREATE", resourceId: data.id, resourceType: "MODERATION_CASE", status: "SUCCESS", details: { contentType, reason, priority } });
  // FM-07: a 1-hour target needs someone to know at once. The alert carries no report details.
  if (priority === "CRITICAL") await notifySafetyTeam({ caseId: data.id, reason, createdAt: data.created_at || new Date().toISOString() });
  return NextResponse.json({ report: data }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
}
