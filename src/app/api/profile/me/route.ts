import { NextRequest, NextResponse } from "next/server";
import { getVerifiedIdentity } from "@/lib/auth0/serverSession";
import { getServerSupabase } from "@/lib/supabase/server";
import { profileToDbRow } from "@/lib/supabase/profileService";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { auditLogger } from "@/lib/auth/auditLogger";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";
const MAX_BODY_BYTES = 64 * 1024;
const MAX_ARRAY_ITEMS = 50;
const MAX_STRING_LENGTH = 2_000;
const ALLOWED_GENDERS = new Set(["FEMALE", "MALE", "COUPLE_MF", "COUPLE_FF", "COUPLE_MM", "NON_BINARY", "TRANSGENDER", "OTHER"]);
const ALLOWED_ORIENTATIONS = new Set(["BISEXUAL", "HETEROSEXUAL", "HOMOSEXUAL", "PANSEXUAL", "FLUID", "QUEER"]);

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  return response;
}

function validateProfileInput(value: unknown): value is Partial<Profile> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  for (const field of Object.values(value as Record<string, unknown>)) {
    if (typeof field === "string" && field.length > MAX_STRING_LENGTH) return false;
    if (Array.isArray(field)) {
      if (field.length > MAX_ARRAY_ITEMS) return false;
      if (field.some((item) => typeof item === "string" && item.length > 200)) return false;
    }
  }
  return true;
}

async function context(req: NextRequest) {
  const identity = await getVerifiedIdentity(req);
  const supabase = getServerSupabase();
  return { identity, supabase };
}

export async function GET(req: NextRequest) {
  const { identity, supabase } = await context(req);
  if (!identity) return noStore(NextResponse.json({ error: "Authentication required" }, { status: 401 }));
  if (!supabase) return noStore(NextResponse.json({ error: "Profile service unavailable" }, { status: 503 }));

  const { data, error } = await supabase.from("profiles").select("*").eq("auth_id", identity.sub).maybeSingle();
  if (error) return noStore(NextResponse.json({ error: "Profile lookup failed" }, { status: 502 }));
  if (!data) return noStore(NextResponse.json({ error: "Profile not found" }, { status: 404 }));
  return noStore(NextResponse.json({ profile: data }));
}

function ageFromDateOfBirth(dateOfBirth: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return null;
  const date = new Date(`${dateOfBirth}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - date.getUTCFullYear();
  const beforeBirthday = now.getUTCMonth() < date.getUTCMonth() || (now.getUTCMonth() === date.getUTCMonth() && now.getUTCDate() < date.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export async function POST(req: NextRequest) {
  const contentLength = Number(req.headers.get("content-length") || "0");
  if (contentLength > MAX_BODY_BYTES) return NextResponse.json({ error: "Profile payload is too large" }, { status: 413 });
  const { identity, supabase } = await context(req);
  if (!identity?.email) return NextResponse.json({ error: "Verified account email required" }, { status: 401 });
  if (!identity.emailVerified) return NextResponse.json({ error: "Email verification required" }, { status: 403 });
  if (!supabase) return NextResponse.json({ error: "Profile service unavailable" }, { status: 503 });

  const rate = checkRateLimit(`profile-create:${identity.sub}`, 5, 60 * 60);
  if (!rate.allowed) return NextResponse.json({ error: "Too many profile creation attempts" }, { status: 429, headers: { "Retry-After": String(rate.resetInSeconds) } });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  if (Buffer.byteLength(JSON.stringify(body), "utf8") > MAX_BODY_BYTES) return NextResponse.json({ error: "Profile payload is too large" }, { status: 413 });

  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  const dateOfBirth = typeof body.dateOfBirth === "string" ? body.dateOfBirth : "";
  const age = ageFromDateOfBirth(dateOfBirth);
  if (displayName.length < 2 || displayName.length > 80) return NextResponse.json({ error: "Display name must be 2-80 characters" }, { status: 400 });
  if (age === null || age < 18 || age > 120) return NextResponse.json({ error: "You must be at least 18 years old" }, { status: 400 });
  if (!ALLOWED_GENDERS.has(body.gender) || !ALLOWED_ORIENTATIONS.has(body.sexualOrientation)) return NextResponse.json({ error: "Invalid demographic selection" }, { status: 400 });
  if (body.explicitSensitiveDataConsent !== true) return NextResponse.json({ error: "Explicit consent is required to process sexual orientation and intimate preferences" }, { status: 400 });

  const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.length <= 200).slice(0, MAX_ARRAY_ITEMS) : [];
  const profileType = ["SINGLE", "COUPLE", "CREATOR", "LIFESTYLE"].includes(body.profileType) ? body.profileType : "SINGLE";
  const username = displayName.toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || `member_${identity.sub.slice(-8)}`;
  const row = {
    auth_id: identity.sub,
    email: identity.email.toLowerCase(),
    display_name: displayName,
    username,
    role: profileType === "COUPLE" ? "COUPLE" : "MEMBER",
    member_tier: "FREE",
    verification_status: "EMAIL_VERIFIED",
    verification_level: "LEVEL_1_EMAIL",
    age_verification_status: "AGE_DECLARED",
    age_verified_at: null,
    age_verification_method: "DATE_OF_BIRTH_DECLARATION",
    date_of_birth: dateOfBirth,
    age,
    gender: body.gender,
    sexual_orientation: body.sexualOrientation,
    country: typeof body.country === "string" ? body.country.slice(0, 120) : "",
    city: typeof body.city === "string" ? body.city.slice(0, 120) : "",
    location: [body.city, body.country].filter((value) => typeof value === "string" && value).join(", ").slice(0, 255),
    languages: ["English"],
    headline: typeof body.headline === "string" ? body.headline.slice(0, 255) : "Intimo Member",
    bio: typeof body.headline === "string" ? body.headline.slice(0, MAX_STRING_LENGTH) : "Private member profile.",
    interests: strings(body.interests),
    lifestyle_tags: ["Discreet"],
    hobbies: strings(body.hobbies),
    sex_hobbies: strings(body.hobbies),
    favourite_sex_positions: strings(body.positions),
    pubic_hair_grooming: typeof body.pubicHairGrooming === "string" ? body.pubicHairGrooming.slice(0, 50) : null,
    piercing: typeof body.piercing === "string" ? body.piercing.slice(0, 50) : null,
    tattoo: typeof body.tattoo === "string" ? body.tattoo.slice(0, 50) : null,
    is_couple_profile: profileType === "COUPLE",
    avatar_url: typeof body.avatarUrl === "string" && body.avatarUrl.startsWith("https://") ? body.avatarUrl.slice(0, 2_000) : null,
    gallery_images: [],
    profile_visibility: "MEMBERS_ONLY",
    sensitive_fields_visibility: "PRIVATE",
    location_precision: "CITY",
    message_permission: "MEMBERS_ONLY",
    public_profile_visibility: false,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("profiles").insert(row).select("*").single();
  if (error?.code === "23505") return NextResponse.json({ error: "Profile already exists" }, { status: 409 });
  if (error || !data) {
    auditLogger.logEvent({ actorId: identity.sub, actorRole: "MEMBER", action: "PROFILE_CREATE", status: "ERROR" });
    return NextResponse.json({ error: "Profile creation failed" }, { status: 502 });
  }
  const consentTimestamp = new Date().toISOString();
  const { error: consentError } = await supabase.from("user_consents").insert({
    profile_id: data.id,
    consent_type: "SPECIAL_CATEGORY_PROFILE",
    consent_version: "sensitive-profile-v1-draft",
    consent_timestamp: consentTimestamp,
    consent_status: "GRANTED",
    withdrawn_at: null,
    source: "ONBOARDING",
  });
  if (consentError) {
    await supabase.from("profiles").delete().eq("id", data.id).eq("auth_id", identity.sub);
    auditLogger.logEvent({ actorId: identity.sub, actorRole: "MEMBER", action: "PROFILE_CREATE", status: "ERROR", details: { reason: "consent_record_failed" } });
    return NextResponse.json({ error: "Consent record could not be created; no profile was retained" }, { status: 502 });
  }
  auditLogger.logEvent({ actorId: identity.sub, actorRole: "MEMBER", action: "PROFILE_CREATE", resourceId: String(data.id), resourceType: "PROFILE", status: "SUCCESS", details: { creatorIntent: profileType === "CREATOR" } });
  return noStore(NextResponse.json({ profile: data }, { status: 201 }));
}

export async function PUT(req: NextRequest) {
  const contentLength = Number(req.headers.get("content-length") || "0");
  if (contentLength > MAX_BODY_BYTES) return NextResponse.json({ error: "Profile payload is too large" }, { status: 413 });

  const { identity, supabase } = await context(req);
  if (!identity) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!supabase) return NextResponse.json({ error: "Profile service unavailable" }, { status: 503 });

  const rate = checkRateLimit(`profile-update:${identity.sub}`, 20, 60);
  if (!rate.allowed) return NextResponse.json({ error: "Too many profile updates" }, { status: 429, headers: { "Retry-After": String(rate.resetInSeconds) } });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  if (Buffer.byteLength(JSON.stringify(body), "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Profile payload is too large" }, { status: 413 });
  }
  const profile = (body as Record<string, unknown>)?.profile;
  if (!validateProfileInput(profile)) return NextResponse.json({ error: "Invalid profile payload" }, { status: 400 });

  // profileToDbRow is an allowlist mapper. No caller-supplied user object is
  // provided, so role, tier, verification, identity, and email cannot change.
  const update = profileToDbRow(identity.sub, identity.email || "", profile);
  delete update.auth_id;
  delete update.email;
  delete update.role;
  delete update.member_tier;
  delete update.verification_status;
  delete update.verification_level;

  const { data, error } = await supabase
    .from("profiles")
    .update(update)
    .eq("auth_id", identity.sub)
    .select("*")
    .maybeSingle();

  if (error) {
    auditLogger.logEvent({ actorId: identity.sub, actorRole: "MEMBER", action: "PROFILE_UPDATE", status: "ERROR" });
    return NextResponse.json({ error: "Profile update failed" }, { status: 502 });
  }
  if (!data) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  auditLogger.logEvent({ actorId: identity.sub, actorRole: "MEMBER", action: "PROFILE_UPDATE", resourceId: String(data.id), resourceType: "PROFILE", status: "SUCCESS" });
  return noStore(NextResponse.json({ profile: data }));
}
