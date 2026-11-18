import { NextRequest, NextResponse } from "next/server";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { appendDurableAudit } from "@/lib/auth/durableAudit";
import { cleanIdentityInput, isMissingColumnError, needsSensitiveConsent } from "@/lib/identity.mjs";
import { consentRow, consentStates } from "@/lib/privacy/consents.mjs";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };
const COLUMNS = "sexual_orientation,orientation_note,gender_note,pronouns,identity_visibility";

async function profileConsent(db: NonNullable<ReturnType<typeof getServerSupabase>>, profileId: string) {
  const { data, error } = await db.from("user_consents").select("consent_type,consent_version,consent_timestamp,consent_status").eq("profile_id", profileId).eq("consent_type", "SPECIAL_CATEGORY_PROFILE");
  if (error) return null;
  return consentStates(data || []).SPECIAL_CATEGORY_PROFILE.granted;
}

/** The member's own identity details and audiences. Owner only. */
export async function GET(req: NextRequest) {
  const auth = await resolveServerActor(req);
  if (auth.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: auth.status === "unauthenticated" ? 401 : 503 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Identity details unavailable" }, { status: 503 });
  const { data, error } = await db.from("profiles").select(COLUMNS).eq("id", auth.actor.profileId).maybeSingle();
  // Before the FM-09 migration is applied the editor explains it isn't ready yet.
  if (isMissingColumnError(error)) return NextResponse.json({ available: false }, { headers: noStore });
  if (error || !data) return NextResponse.json({ error: "Identity details lookup failed" }, { status: 502 });
  const consent = await profileConsent(db, auth.actor.profileId);
  if (consent === null) return NextResponse.json({ error: "Consent lookup failed" }, { status: 502 });
  const row = data as unknown as Record<string, unknown>;
  return NextResponse.json({
    available: true,
    consent,
    orientation: row.sexual_orientation ?? null,
    orientationNote: row.orientation_note ?? null,
    genderNote: row.gender_note ?? null,
    pronouns: row.pronouns ?? null,
    visibility: row.identity_visibility ?? {},
  }, { headers: noStore });
}

/**
 * Replaces the member's identity details. Orientation and the two notes are special-category
 * data: saving them needs the SPECIAL_CATEGORY_PROFILE consent, given here with the same
 * wording as in Settings, or earlier.
 */
export async function PUT(req: NextRequest) {
  const auth = await resolveServerActor(req);
  if (auth.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: auth.status === "unauthenticated" ? 401 : 503 });
  const rate = (await checkRateLimit(`identity:${auth.actor.userId}`, 30, 60));
  if (!rate.allowed) return NextResponse.json({ error: "Too many updates" }, { status: 429, headers: { "Retry-After": String(rate.resetInSeconds) } });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const cleaned = cleanIdentityInput(body);
  if (!cleaned.value) return NextResponse.json({ error: cleaned.error === "contact" ? "Links and contact details can't go here" : cleaned.error === "too_long" ? "That's too long" : "Invalid identity details", field: cleaned.field }, { status: 400 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Identity details unavailable" }, { status: 503 });
  const profileId = auth.actor.profileId;

  if (needsSensitiveConsent(cleaned.value)) {
    const consent = await profileConsent(db, profileId);
    if (consent === null) return NextResponse.json({ error: "Consent lookup failed" }, { status: 502 });
    if (!consent) {
      if (body.consent !== true) return NextResponse.json({ error: "Explicit consent is required before saving these details", consentRequired: true }, { status: 412 });
      const { error: consentError } = await db.from("user_consents").insert(consentRow({ profileId, type: "SPECIAL_CATEGORY_PROFILE", granted: true, source: "IDENTITY_EDITOR" }));
      if (consentError) return NextResponse.json({ error: "Consent could not be recorded; nothing was saved" }, { status: 502 });
    }
  }

  const { error } = await db.from("profiles").update({ ...cleaned.value, updated_at: new Date().toISOString() }).eq("id", profileId);
  if (isMissingColumnError(error)) return NextResponse.json({ error: "Identity details aren't available yet" }, { status: 503 });
  if (error) return NextResponse.json({ error: "Identity details could not be saved" }, { status: 502 });
  // Which fields are filled, never their values: the audit trail must not copy special-category data.
  const filled = ["sexual_orientation", "orientation_note", "gender_note", "pronouns"].filter((key) => cleaned.value[key as keyof typeof cleaned.value]);
  await appendDurableAudit(db, { actorProfileId: profileId, actorUserId: auth.actor.userId, action: "IDENTITY_UPDATE", resourceType: "PROFILE", resourceId: profileId, outcome: "SUCCESS", metadata: { filled } });
  return NextResponse.json({ saved: true }, { headers: noStore });
}
