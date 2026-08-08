import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { dbRowToDatingAd, DatingAdRow } from "@/lib/supabase/datingAdService";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { auditLogger } from "@/lib/auth/auditLogger";
import { appendDurableAudit } from "@/lib/auth/durableAudit";

export const dynamic = "force-dynamic";
const MAX_BODY_BYTES = 32 * 1024;

export async function GET(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Dating ads unavailable" }, { status: 503 });
  const mine = new URL(req.url).searchParams.get("mine") === "true";
  let query = supabase.from("dating_ads").select("*").order("created_at", { ascending: false }).limit(200);
  query = mine ? query.eq("author_id", actor.actor.profileId) : query.eq("status", "active");
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Dating ads lookup failed" }, { status: 502 });
  return NextResponse.json({ ads: (data || []).map((row) => dbRowToDatingAd(row as DatingAdRow)) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  const rate = checkRateLimit(`dating-ad-create:${actor.actor.auth0Sub}`, 10, 60 * 60);
  if (!rate.allowed) return NextResponse.json({ error: "Too many ads created" }, { status: 429, headers: { "Retry-After": String(rate.resetInSeconds) } });
  const contentLength = Number(req.headers.get("content-length") || "0");
  if (contentLength > MAX_BODY_BYTES) return NextResponse.json({ error: "Payload too large" }, { status: 413 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  if (Buffer.byteLength(JSON.stringify(body), "utf8") > MAX_BODY_BYTES) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const minAge = Number(body.minAge);
  const maxAge = Number(body.maxAge);
  const validityDays = Number(body.validityDays);
  if (title.length < 3 || title.length > 120 || text.length < 10 || text.length > 4_000 || category.length < 2 || category.length > 120) return NextResponse.json({ error: "Invalid title, category, or description" }, { status: 400 });
  if (!Number.isInteger(minAge) || !Number.isInteger(maxAge) || minAge < 18 || maxAge > 120 || minAge > maxAge) return NextResponse.json({ error: "Invalid age range" }, { status: 400 });
  if (![1, 3, 7, 14, 30].includes(validityDays)) return NextResponse.json({ error: "Invalid validity period" }, { status: 400 });

  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Dating ads unavailable" }, { status: 503 });
  const { data: profile, error: profileError } = await supabase.from("profiles").select("display_name,avatar_url,verification_level,country,city").eq("id", actor.actor.profileId).single();
  if (profileError || !profile) return NextResponse.json({ error: "Author profile unavailable" }, { status: 502 });
  const allowedGenders = Array.isArray(body.allowedReplyGenders) ? body.allowedReplyGenders.filter((value: unknown): value is string => typeof value === "string" && ["♀", "♂", "👫", "⚧"].includes(value)).slice(0, 4) : [];
  const transgenderOption = ["Including trans", "Excluding trans", "Only trans"].includes(body.transgenderOption) ? body.transgenderOption : "Including trans";
  const row = {
    author_id: actor.actor.profileId,
    author_name: profile.display_name,
    author_avatar: profile.avatar_url,
    is_verified: ["LEVEL_3_PROFILE_BIOMETRIC", "LEVEL_4_CREATOR"].includes(profile.verification_level),
    category, title, text,
    photo_url: typeof body.photoUrl === "string" && body.photoUrl.startsWith("https://") ? body.photoUrl.slice(0, 2_000) : null,
    validity_days: validityDays,
    country: typeof body.country === "string" ? body.country.slice(0, 120) : profile.country,
    region: typeof body.region === "string" ? body.region.slice(0, 120) : profile.city,
    allowed_reply_genders: allowedGenders,
    transgender_option: transgenderOption,
    min_age: minAge,
    max_age: maxAge,
    // Legacy database field retained for migration compatibility. VIP gates are
    // never accepted from clients in the free MVP.
    require_vip: false,
    require_media: body.requireMedia === true,
    require_verified: body.requireVerified === true,
    status: "active",
  };
  const { data, error } = await supabase.from("dating_ads").insert(row).select("*").single();
  if (error || !data) return NextResponse.json({ error: "Dating ad creation failed" }, { status: 502 });
  const audited = await appendDurableAudit(supabase, { actorProfileId: actor.actor.profileId, actorAuth0Sub: actor.actor.auth0Sub, action: "DATING_AD_CREATE", resourceType: "DATING_AD", resourceId: String(data.id), outcome: "SUCCESS", metadata: { validityDays, hasMedia: Boolean(row.photo_url) } });
  if (!audited) return NextResponse.json({ error: "Dating ad created but audit recording failed; contact support" }, { status: 503 });
  auditLogger.logEvent({ actorId: actor.actor.auth0Sub, actorRole: actor.actor.role as any, action: "DATING_AD_CREATE", resourceId: String(data.id), resourceType: "DATING_AD", status: "SUCCESS" });
  return NextResponse.json({ ad: dbRowToDatingAd(data as DatingAdRow) }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
}
