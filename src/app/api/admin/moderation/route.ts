import { NextRequest, NextResponse } from "next/server";
import { requestSecurityMetadata, requireAdminPermission } from "@/lib/auth/adminApi";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const STATUSES = new Set(["OPEN","UNDER_REVIEW","ACTION_REQUIRED","RESOLVED","REJECTED","APPEALED","ESCALATED"]);

export async function GET(req: NextRequest) {
  const auth = await requireAdminPermission(req, "moderation:view");
  if ("response" in auth) return auth.response;
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Moderation service unavailable" }, { status: 503 });
  const { data, error } = await supabase.from("moderation_cases").select("*").order("priority", { ascending: true }).order("created_at", { ascending: true }).limit(500);
  if (error) return NextResponse.json({ error: "Moderation queue lookup failed" }, { status: 502 });
  return NextResponse.json({ cases: data || [] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminPermission(req, "moderation:decide");
  if ("response" in auth) return auth.response;
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const id = typeof body.id === "string" ? body.id : "";
  const status = typeof body.status === "string" ? body.status : "";
  const decision = typeof body.decision === "string" ? body.decision.trim().slice(0, 200) : null;
  const decisionReason = typeof body.decisionReason === "string" ? body.decisionReason.trim().slice(0, 4_000) : null;
  if (!id || !STATUSES.has(status) || (["RESOLVED","REJECTED"].includes(status) && (!decision || !decisionReason))) return NextResponse.json({ error: "Invalid moderation decision" }, { status: 400 });
  const now = new Date().toISOString();
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Moderation service unavailable" }, { status: 503 });
  const { data: before } = await supabase.from("moderation_cases").select("id,status,priority").eq("id", id).maybeSingle();
  if (!before) return NextResponse.json({ error: "Moderation case not found" }, { status: 404 });
  if (before.priority === "CRITICAL") {
    const critical = await requireAdminPermission(req, "moderation:critical");
    if ("response" in critical) return critical.response;
  }
  const { data, error } = await supabase.from("moderation_cases").update({ status, assigned_moderator: auth.actor.profileId, decision, decision_reason: decisionReason, decision_timestamp: ["RESOLVED","REJECTED"].includes(status) ? now : null, updated_at: now }).eq("id", id).select("*").single();
  if (error || !data) return NextResponse.json({ error: "Moderation case update failed" }, { status: 502 });
  const { error: eventError } = await supabase.from("moderation_events").insert({ case_id: id, actor_profile_id: auth.actor.profileId, action: decision ? "DECISION_RECORDED" : "STATUS_CHANGED", from_status: before.status, to_status: status, reason: decisionReason });
  if (eventError) return NextResponse.json({ error: "Moderation history could not be recorded" }, { status: 502 });
  const { error: auditError } = await supabase.from("admin_action_events").insert({ actor_profile_id: auth.actor.profileId, actor_role: auth.actor.role, action: "MODERATION_CASE_UPDATE", category: before.priority === "CRITICAL" ? "CRITICAL_SAFETY" : "MODERATION", resource_type: "MODERATION_CASE", resource_id: id, reason: decisionReason || `Status changed to ${status}`, previous_state: { status: before.status }, new_state: { status, decision }, security_metadata: requestSecurityMetadata(req) });
  if (auditError) return NextResponse.json({ error: "Moderation audit could not be recorded" }, { status: 502 });
  return NextResponse.json({ case: data });
}
