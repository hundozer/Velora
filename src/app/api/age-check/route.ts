import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { appendDurableAudit } from "@/lib/auth/durableAudit";
import { isMissingColumnError } from "@/lib/identity.mjs";
import { SUBMIT_STATUSES, challengeIsFresh, hasSetupAccess, memberAgeCheckState, newChallengeCode } from "@/lib/auth/ageCheck.mjs";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PROFILE = "id,age_verification_status,is_couple_profile,partner_display_name,age_check_code,age_check_code_issued_at";

type Db = NonNullable<ReturnType<typeof getServerSupabase>>;
type Row = { id: string; age_verification_status: string; is_couple_profile: boolean | null; partner_display_name: string | null; age_check_code: string | null; age_check_code_issued_at: string | null };

async function load(db: Db, profileId: string) {
  const { data, error } = await db.from("profiles").select(PROFILE).eq("id", profileId).maybeSingle();
  return { row: data as Row | null, error };
}

/**
 * FM-06: the member's own age check. Returns their state and, while they may submit, a
 * one-time code to hold up in the selfie. The code is kept on the server for 24 hours and
 * used once, so an old photo can't be reused.
 */
export async function GET(req: NextRequest) {
  const auth = await resolveServerActor(req);
  if (auth.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: auth.status === "unauthenticated" ? 401 : 503 });
  if (auth.actor.accountStatus !== "ACTIVE") return NextResponse.json({ error: "Account not active" }, { status: 403 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Age check unavailable" }, { status: 503 });
  const { row, error } = await load(db, auth.actor.profileId);
  if (isMissingColumnError(error)) return NextResponse.json({ available: false }, { headers: noStore });
  if (error || !row) return NextResponse.json({ error: "Age check lookup failed" }, { status: 502 });
  const state = memberAgeCheckState(row.age_verification_status);
  const base = { available: true, state, couple: row.is_couple_profile === true, partnerName: row.is_couple_profile ? row.partner_display_name : null };
  if (!SUBMIT_STATUSES.includes(row.age_verification_status)) return NextResponse.json(base, { headers: noStore });

  let code = row.age_check_code;
  let issuedAt = row.age_check_code_issued_at;
  if (!challengeIsFresh(code, issuedAt)) {
    if (!(await checkRateLimit(`age-check-code:${auth.actor.userId}`, 10, 24 * 60 * 60)).allowed) return NextResponse.json({ error: "Too many new codes today. Try again tomorrow." }, { status: 429 });
    code = newChallengeCode(randomBytes);
    issuedAt = new Date().toISOString();
    // Only replace the code we read, so two open tabs end up showing the same code.
    const { data: saved, error: saveError } = await db.from("profiles").update({ age_check_code: code, age_check_code_issued_at: issuedAt })
      .eq("id", row.id).in("age_verification_status", SUBMIT_STATUSES).select("age_check_code,age_check_code_issued_at").maybeSingle();
    if (saveError) return NextResponse.json({ error: "Age check code could not be created" }, { status: 502 });
    if (!saved) return NextResponse.json({ error: "Your age check changed. Reload the page." }, { status: 409 });
  }
  return NextResponse.json({ ...base, code, expiresAt: new Date(Date.parse(issuedAt as string) + 24 * 60 * 60 * 1000).toISOString() }, { headers: noStore });
}

/** Submits the selfie (a private photo the member just uploaded) for an admin to review. */
export async function POST(req: NextRequest) {
  const auth = await resolveServerActor(req);
  if (auth.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: auth.status === "unauthenticated" ? 401 : 503 });
  if (!hasSetupAccess(auth.actor)) return NextResponse.json({ error: "Account not active" }, { status: 403 });
  const rate = (await checkRateLimit(`age-check-submit:${auth.actor.userId}`, 5, 24 * 60 * 60));
  if (!rate.allowed) return NextResponse.json({ error: "Too many submissions today. Try again tomorrow." }, { status: 429, headers: { "Retry-After": String(rate.resetInSeconds) } });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const mediaId = typeof body.mediaId === "string" ? body.mediaId : "";
  if (!UUID.test(mediaId)) return NextResponse.json({ error: "Upload your selfie first" }, { status: 400 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Age check unavailable" }, { status: 503 });
  const profileId = auth.actor.profileId;

  const { row, error } = await load(db, profileId);
  if (isMissingColumnError(error)) return NextResponse.json({ error: "The age check isn't available yet" }, { status: 503 });
  if (error || !row) return NextResponse.json({ error: "Age check lookup failed" }, { status: 502 });
  if (row.age_verification_status === "PENDING") return NextResponse.json({ error: "Your age check is already with us" }, { status: 409 });
  if (!SUBMIT_STATUSES.includes(row.age_verification_status)) return NextResponse.json({ error: "Your account can't submit an age check" }, { status: 403 });
  const code = row.age_check_code;
  if (!challengeIsFresh(code, row.age_check_code_issued_at)) return NextResponse.json({ error: "Your code expired. Reload the page for a new one and take the selfie again.", codeExpired: true }, { status: 409 });

  const { data: media } = await db.from("media_objects").select("id,owner_id,media_type,upload_status,visibility").eq("id", mediaId).eq("owner_id", profileId).maybeSingle();
  if (!media || media.media_type !== "IMAGE" || media.upload_status !== "AVAILABLE" || media.visibility !== "PRIVATE") return NextResponse.json({ error: "Upload your selfie again" }, { status: 400 });

  // Claim the submission first: only one request moves the profile to PENDING and spends the code.
  const { data: claimed, error: claimError } = await db.from("profiles").update({ age_verification_status: "PENDING", age_check_code: null, age_check_code_issued_at: null })
    .eq("id", profileId).eq("age_check_code", code as string).in("age_verification_status", SUBMIT_STATUSES).select("id").maybeSingle();
  if (claimError) return NextResponse.json({ error: "Age check could not be submitted" }, { status: 502 });
  if (!claimed) return NextResponse.json({ error: "Your age check changed. Reload the page." }, { status: 409 });

  const { data: review, error: reviewError } = await db.from("verification_reviews").insert({ profile_id: profileId, verification_type: "AGE", status: "PENDING", provider_method: "MANUAL_SELFIE_CODE", provider_reference: mediaId, challenge_code: code }).select("id,status,submitted_at").single();
  if (reviewError || !review) {
    // Put the member back where they were, with the same code, so they can simply retry.
    await db.from("profiles").update({ age_verification_status: row.age_verification_status, age_check_code: code, age_check_code_issued_at: row.age_check_code_issued_at }).eq("id", profileId).eq("age_verification_status", "PENDING");
    return NextResponse.json({ error: "Age check could not be submitted. Try again." }, { status: 502 });
  }
  await appendDurableAudit(db, { actorProfileId: profileId, actorUserId: auth.actor.userId, action: "AGE_CHECK_SUBMIT", resourceType: "VERIFICATION_REVIEW", resourceId: review.id, outcome: "SUCCESS", metadata: { method: "MANUAL_SELFIE_CODE", couple: row.is_couple_profile === true } });
  return NextResponse.json({ state: "PENDING", review }, { status: 201, headers: noStore });
}
