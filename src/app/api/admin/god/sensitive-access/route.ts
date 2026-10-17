import { NextRequest, NextResponse } from "next/server";
import { requireGodMode } from "@/lib/auth/godMode";
import { getServerSupabase } from "@/lib/supabase/server";
const TYPES = new Set(["PRIVATE_MEDIA","MESSAGE_EVIDENCE","PRECISE_LOCATION","VERIFICATION_EVIDENCE","VIEW_AS_USER"]);
export async function POST(req: NextRequest) {
  const god = await requireGodMode(req, "users:view_sensitive"); if (!("elevatedSessionId" in god)) return god.response;
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const accessType = typeof body.accessType === "string" ? body.accessType : ""; const resourceType = typeof body.resourceType === "string" ? body.resourceType.slice(0,100) : ""; const resourceId = typeof body.resourceId === "string" ? body.resourceId.slice(0,200) : ""; const caseReference = typeof body.caseReference === "string" ? body.caseReference.trim().slice(0,200) : ""; const reason = typeof body.reason === "string" ? body.reason.trim().slice(0,1000) : "";
  if (!TYPES.has(accessType) || !resourceType || !resourceId || !caseReference || !reason || body.confirmation !== "CONFIRM SENSITIVE ACCESS") return NextResponse.json({ error: "Purpose, case reference, reason and exact confirmation are required" }, { status: 400 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Sensitive access unavailable" }, { status: 503 });
  const { data: caseRow } = await db.from("moderation_cases").select("id").eq("id", caseReference).maybeSingle(); const { data: privacyRow } = caseRow ? { data: null } : await db.from("privacy_requests").select("id").eq("id", caseReference).maybeSingle();
  if (!caseRow && !privacyRow) return NextResponse.json({ error: "A valid moderation or privacy case reference is required" }, { status: 400 });
  const { error } = await db.from("sensitive_access_events").insert({ actor_profile_id: god.actor.profileId, elevated_session_id: god.elevatedSessionId, access_type: accessType, resource_type: resourceType, resource_id: resourceId, case_reference: caseReference, reason });
  if (error) return NextResponse.json({ error: "Sensitive access audit could not be created" }, { status: 502 });
  if (accessType === "VIEW_AS_USER") { const { data: profile } = await db.from("profiles").select("id,username,display_name,profile_visibility,discovery_disabled,messaging_disabled,media_uploads_disabled,account_status").eq("id", resourceId).maybeSingle(); if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 }); return NextResponse.json({ mode: "READ_ONLY_SIMULATION", user: profile, restrictions: ["NO_CREDENTIAL_ACCESS","NO_MESSAGE_SENDING","NO_DATA_MUTATION"] }); }
  return NextResponse.json({ authorized: true, accessEventRecorded: true, note: "Evidence retrieval requires its resource-specific controlled endpoint." });
}
