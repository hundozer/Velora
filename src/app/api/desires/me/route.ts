import { NextRequest, NextResponse } from "next/server";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { appendDurableAudit } from "@/lib/auth/durableAudit";
import { cleanDesireSelections } from "@/lib/desires.mjs";
import { DESIRE_CONSENT_TYPE, DESIRE_CONSENT_VERSION, hasDesireConsent } from "@/lib/privacy/desireConsent";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };

export async function GET(req: NextRequest) {
  const auth = await resolveServerActor(req);
  if (auth.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: auth.status === "unauthenticated" ? 401 : 503 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Desires unavailable" }, { status: 503 });
  const consent = await hasDesireConsent(db, auth.actor.profileId);
  if (consent === null) return NextResponse.json({ error: "Consent lookup failed" }, { status: 502 });
  const { data, error } = await db.from("member_desires").select("desire_id,state,visibility").eq("profile_id", auth.actor.profileId);
  if (error) return NextResponse.json({ error: "Desires lookup failed" }, { status: 502 });
  return NextResponse.json({ consent, selections: data || [] }, { headers: noStore });
}

/** Replaces the member's desire set. Requires explicit special-category consent. */
export async function PUT(req: NextRequest) {
  const auth = await resolveServerActor(req);
  if (auth.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: auth.status === "unauthenticated" ? 401 : 503 });
  const rate = checkRateLimit(`desires:${auth.actor.userId}`, 30, 60);
  if (!rate.allowed) return NextResponse.json({ error: "Too many updates" }, { status: 429, headers: { "Retry-After": String(rate.resetInSeconds) } });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Desires unavailable" }, { status: 503 });

  const profileId = auth.actor.profileId;
  const consent = await hasDesireConsent(db, profileId);
  if (consent === null) return NextResponse.json({ error: "Consent lookup failed" }, { status: 502 });
  if (!consent) {
    if (body.consent !== true) return NextResponse.json({ error: "Explicit consent is required before saving desires", consentRequired: true }, { status: 412 });
    const now = new Date().toISOString();
    const { error: consentError } = await db.from("user_consents").insert({
      profile_id: profileId, consent_type: DESIRE_CONSENT_TYPE, consent_version: DESIRE_CONSENT_VERSION,
      consent_timestamp: now, consent_status: "GRANTED", withdrawn_at: null, source: "DESIRES_EDITOR",
    });
    if (consentError) return NextResponse.json({ error: "Consent could not be recorded; nothing was saved" }, { status: 502 });
  }

  const rows = cleanDesireSelections(body.selections);
  const keep = rows.map((row) => row.desire_id);
  let removal = db.from("member_desires").delete().eq("profile_id", profileId);
  if (keep.length > 0) removal = removal.not("desire_id", "in", `(${keep.join(",")})`);
  const { error: removeError } = await removal;
  if (removeError) return NextResponse.json({ error: "Desires could not be saved" }, { status: 502 });
  if (rows.length > 0) {
    const updatedAt = new Date().toISOString();
    const { error: upsertError } = await db.from("member_desires").upsert(rows.map((row) => ({ ...row, profile_id: profileId, updated_at: updatedAt })), { onConflict: "profile_id,desire_id" });
    if (upsertError) return NextResponse.json({ error: "Desires could not be saved" }, { status: 502 });
  }
  // Counts only: the audit trail must not copy special-category data.
  await appendDurableAudit(db, { actorProfileId: profileId, actorUserId: auth.actor.userId, action: "DESIRES_UPDATE", resourceType: "PROFILE", resourceId: profileId, outcome: "SUCCESS", metadata: { count: rows.length } });
  return NextResponse.json({ consent: true, selections: rows }, { headers: noStore });
}
