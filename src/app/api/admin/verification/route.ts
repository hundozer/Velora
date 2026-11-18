import { NextRequest, NextResponse } from "next/server";
import { requestSecurityMetadata, requireAdminPermission } from "@/lib/auth/adminApi";
import { getServerSupabase } from "@/lib/supabase/server";
import { isMissingColumnError } from "@/lib/identity.mjs";
import { profileStatusForDecision } from "@/lib/auth/ageCheck.mjs";
const REVIEW_COLUMNS = "id,profile_id,verification_type,status,provider_method,provider_reference,submitted_at,reviewed_at,reviewed_by,reason";
const DECISIONS = new Set(["VERIFIED","FAILED","REVIEW_REQUIRED","RETRY_REQUESTED"]);
export async function GET(req: NextRequest) {
  const auth = await requireAdminPermission(req, "verification:view"); if ("response" in auth) return auth.response;
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Verification administration unavailable" }, { status: 503 });
  const queueOnly = req.nextUrl.searchParams.get("queue") === "1";
  const list = (columns: string) => {
    let query = db.from("verification_reviews").select(columns);
    if (queueOnly) query = query.in("status", ["PENDING", "REVIEW_REQUIRED"]);
    return query.order("submitted_at", { ascending: true }).limit(250);
  };
  // challenge_code arrives with the FM-06 migration; before it the queue still loads.
  let result = await list(`${REVIEW_COLUMNS},challenge_code`);
  if (isMissingColumnError(result.error)) result = await list(REVIEW_COLUMNS);
  if (result.error) return NextResponse.json({ error: "Verification queue failed" }, { status: 502 });
  const reviews = (result.data || []) as unknown as Array<Record<string, unknown>>;
  // FM-06: an age check is judged against who the profile says is on it (one person or a couple).
  const ageIds = Array.from(new Set(reviews.filter((row) => row.verification_type === "AGE").map((row) => String(row.profile_id))));
  const { data: subjects, error: subjectError } = ageIds.length ? await db.from("profiles").select("id,display_name,age,is_couple_profile,partner_display_name,partner_age,avatar_url").in("id", ageIds) : { data: [], error: null };
  if (subjectError) return NextResponse.json({ error: "Verification queue failed" }, { status: 502 });
  const byId = new Map((subjects || []).map((row) => [row.id, row]));
  const rows = reviews.map((row) => row.verification_type === "AGE" ? { ...row, subject: byId.get(String(row.profile_id)) || null } : row);
  return NextResponse.json({ reviews: rows }, { headers: { "Cache-Control": "private, no-store" } });
}
export async function PATCH(req: NextRequest) {
  const auth = await requireAdminPermission(req, "verification:decide"); if ("response" in auth) return auth.response;
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const id = typeof body.id === "string" ? body.id : ""; const status = typeof body.status === "string" ? body.status : ""; const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 2000) : "";
  if (!id || !DECISIONS.has(status) || !reason) return NextResponse.json({ error: "Decision and reason are required" }, { status: 400 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Verification administration unavailable" }, { status: 503 });
  const { data: before } = await db.from("verification_reviews").select("id,profile_id,verification_type,status").eq("id", id).maybeSingle(); if (!before) return NextResponse.json({ error: "Verification review not found" }, { status: 404 });
  // A closed age check can't be reopened from here (the member may have submitted a newer one);
  // repeating the same decision is allowed so a half-applied decision can be completed.
  if (before.verification_type === "AGE" && !["PENDING", "REVIEW_REQUIRED"].includes(before.status) && before.status !== status) return NextResponse.json({ error: "This age check is already decided" }, { status: 409 });
  const { data: after, error } = await db.from("verification_reviews").update({ status, reason, reviewed_by: auth.actor.profileId, reviewed_at: new Date().toISOString() }).eq("id", id).select("id,profile_id,verification_type,status,reviewed_at").single(); if (error || !after) return NextResponse.json({ error: "Verification decision failed" }, { status: 502 });
  if (before.verification_type === "AGE") {
    // FM-06: VERIFIED lets the member in; FAILED refuses; RETRY_REQUESTED asks for a new selfie.
    const ageStatus = profileStatusForDecision(status);
    const verified = ageStatus === "AGE_VERIFIED";
    const { error: profileError } = await db.from("profiles").update({ age_verification_status: ageStatus, ...(verified ? { age_verified_at: new Date().toISOString(), age_verification_method: "MANUAL_SELFIE_CODE" } : {}) }).eq("id", before.profile_id);
    if (profileError) return NextResponse.json({ error: "Decision saved on the review, but the member's account was not updated. Apply the decision again." }, { status: 502 });
  }
  if (before.verification_type === "IDENTITY") await db.from("profiles").update({ verification_status: status === "VERIFIED" ? "VERIFIED" : status, verification_level: status === "VERIFIED" ? "LEVEL_3_PROFILE_BIOMETRIC" : null }).eq("id", before.profile_id);
  const { error: auditError } = await db.from("admin_action_events").insert({ actor_profile_id: auth.actor.profileId, actor_role: auth.actor.role, action: "VERIFICATION_DECISION", category: before.verification_type, resource_type: "VERIFICATION_REVIEW", resource_id: id, reason, previous_state: { status: before.status }, new_state: { status }, security_metadata: requestSecurityMetadata(req) });
  if (auditError) return NextResponse.json({ error: "Verification audit failed" }, { status: 502 });
  return NextResponse.json({ review: after });
}
