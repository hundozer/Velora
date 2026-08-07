import { NextRequest, NextResponse } from "next/server";
import { requestSecurityMetadata, requireAdminPermission } from "@/lib/auth/adminApi";
import { getServerSupabase } from "@/lib/supabase/server";
const DECISIONS = new Set(["VERIFIED","FAILED","REVIEW_REQUIRED","RETRY_REQUESTED"]);
export async function GET(req: NextRequest) {
  const auth = await requireAdminPermission(req, "verification:view"); if ("response" in auth) return auth.response;
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Verification administration unavailable" }, { status: 503 });
  const { data, error } = await db.from("verification_reviews").select("id,profile_id,verification_type,status,provider_method,submitted_at,reviewed_at,reviewed_by,reason").order("submitted_at", { ascending: true }).limit(250);
  if (error) return NextResponse.json({ error: "Verification queue failed" }, { status: 502 });
  return NextResponse.json({ reviews: data || [] }, { headers: { "Cache-Control": "private, no-store" } });
}
export async function PATCH(req: NextRequest) {
  const auth = await requireAdminPermission(req, "verification:decide"); if ("response" in auth) return auth.response;
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const id = typeof body.id === "string" ? body.id : ""; const status = typeof body.status === "string" ? body.status : ""; const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 2000) : "";
  if (!id || !DECISIONS.has(status) || !reason) return NextResponse.json({ error: "Decision and reason are required" }, { status: 400 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Verification administration unavailable" }, { status: 503 });
  const { data: before } = await db.from("verification_reviews").select("id,profile_id,verification_type,status").eq("id", id).maybeSingle(); if (!before) return NextResponse.json({ error: "Verification review not found" }, { status: 404 });
  const { data: after, error } = await db.from("verification_reviews").update({ status, reason, reviewed_by: auth.actor.profileId, reviewed_at: new Date().toISOString() }).eq("id", id).select("id,profile_id,verification_type,status,reviewed_at").single(); if (error || !after) return NextResponse.json({ error: "Verification decision failed" }, { status: 502 });
  if (before.verification_type === "AGE") await db.from("profiles").update({ age_verification_status: status === "VERIFIED" ? "AGE_VERIFIED" : status }).eq("id", before.profile_id);
  const { error: auditError } = await db.from("admin_action_events").insert({ actor_profile_id: auth.actor.profileId, actor_role: auth.actor.role, action: "VERIFICATION_DECISION", category: before.verification_type, resource_type: "VERIFICATION_REVIEW", resource_id: id, reason, previous_state: { status: before.status }, new_state: { status }, security_metadata: requestSecurityMetadata(req) });
  if (auditError) return NextResponse.json({ error: "Verification audit failed" }, { status: 502 });
  return NextResponse.json({ review: after });
}
