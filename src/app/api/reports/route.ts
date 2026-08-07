import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { auditLogger } from "@/lib/auth/auditLogger";

export const dynamic = "force-dynamic";
const TYPES = new Set(["PROFILE","PHOTO","VIDEO","MESSAGE","POST","COMMENT","COMMUNITY","EVENT","LIVESTREAM"]);
const REASONS = new Set(["SUSPECTED_MINOR","NON_CONSENSUAL_INTIMATE_CONTENT","HARASSMENT","THREATS","IMPERSONATION","SCAM_FRAUD","ILLEGAL_CONTENT","EXPLOITATION_TRAFFICKING","COPYRIGHT_INFRINGEMENT","PRIVACY_VIOLATION","PROHIBITED_COMMERCIAL_SEXUAL_SERVICES","SPAM","OTHER"]);
const CRITICAL = new Set(["SUSPECTED_MINOR","NON_CONSENSUAL_INTIMATE_CONTENT","EXPLOITATION_TRAFFICKING"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Reporting service unavailable" }, { status: 503 });
  const { data, error } = await supabase.from("moderation_cases").select("id,content_type,content_id,reason,status,priority,decision,decision_reason,decision_timestamp,appeal_status,created_at").or(`reporter_id.eq.${actor.actor.profileId},reported_user_id.eq.${actor.actor.profileId}`).order("created_at", { ascending: false }).limit(200);
  if (error) return NextResponse.json({ error: "Report history lookup failed" }, { status: 502 });
  return NextResponse.json({ reports: data || [] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  const rate = checkRateLimit(`report:${actor.actor.auth0Sub}`, 15, 24 * 60 * 60);
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
  const { data, error } = await supabase.from("moderation_cases").insert({ reporter_id: actor.actor.profileId, reported_user_id: reportedUserId, content_type: contentType, content_id: contentId, reason, description, priority, status }).select("id,status,priority,created_at").single();
  if (error || !data) return NextResponse.json({ error: "Report submission failed" }, { status: 502 });
  const { error: eventError } = await supabase.from("moderation_events").insert({ case_id: data.id, actor_profile_id: actor.actor.profileId, action: priority === "CRITICAL" ? "CRITICAL_REPORT_ESCALATED" : "REPORT_CREATED", from_status: null, to_status: status, reason });
  if (eventError) return NextResponse.json({ error: "Report history could not be recorded" }, { status: 502 });
  auditLogger.logEvent({ actorId: actor.actor.auth0Sub, actorRole: actor.actor.role as any, action: "REPORT_CREATE", resourceId: data.id, resourceType: "MODERATION_CASE", status: "SUCCESS", details: { contentType, reason, priority } });
  return NextResponse.json({ report: data }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
}
