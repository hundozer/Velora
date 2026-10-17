import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { toAnonymousPublicProfile } from "@/lib/supabase/publicCommunity";
import type { PublicProfileRow } from "@/lib/supabase/publicCommunity";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 18;
const MAX_LIMIT = 36;
const MAX_PAGE = 500;

function clientKey(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const candidate = forwarded || req.headers.get("x-real-ip") || "unknown";
  return candidate.replace(/[^a-fA-F0-9:.[\]-]/g, "").slice(0, 80) || "unknown";
}

function positiveInteger(value: string | null, fallback: number, maximum: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
}

export async function GET(req: NextRequest) {
  const rate = (await checkRateLimit(`public-community:${clientKey(req)}`, 90, 60));
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many public discovery requests" },
      { status: 429, headers: { "Retry-After": String(rate.resetInSeconds) } }
    );
  }

  const url = new URL(req.url);
  const page = positiveInteger(url.searchParams.get("page"), 1, MAX_PAGE);
  const limit = positiveInteger(url.searchParams.get("limit"), DEFAULT_LIMIT, MAX_LIMIT);
  const offset = (page - 1) * limit;
  const search = (url.searchParams.get("q") || "").trim().slice(0, 80);
  const country = (url.searchParams.get("country") || "").trim().slice(0, 80);
  const city = (url.searchParams.get("city") || "").trim().slice(0, 80);
  const profileType = url.searchParams.get("profileType");
  const gender = url.searchParams.get("gender");
  const minAge = positiveInteger(url.searchParams.get("minAge"), 18, 100);
  const maxAge = positiveInteger(url.searchParams.get("maxAge"), 100, 100);
  const verifiedOnly = url.searchParams.get("verified") === "true";
  const recentlyActiveOnly = url.searchParams.get("recentlyActive") === "true";

  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Public community is temporarily unavailable" }, { status: 503 });

  let profileQuery = db
    .from("profiles")
    .select(
      "id,display_name,username,age,country,city,headline,bio,is_couple_profile,verification_status,verification_level,location_precision,show_online_status,last_active_at,created_at",
      { count: "exact" }
    )
    .eq("profile_visibility", "EVERYONE")
    .eq("public_profile_visibility", true)
    .eq("account_status", "ACTIVE")
    .eq("discovery_disabled", false)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);

  if (country) profileQuery = profileQuery.ilike("country", country);
  if (city) profileQuery = profileQuery.ilike("city", `%${city.replace(/[%_,()]/g, "")}%`);
  if (profileType === "COUPLE") profileQuery = profileQuery.eq("is_couple_profile", true);
  if (profileType === "INDIVIDUAL") profileQuery = profileQuery.eq("is_couple_profile", false);
  if (gender === "MALE" || gender === "FEMALE") profileQuery = profileQuery.eq("is_couple_profile", false).eq("gender", gender);
  profileQuery = profileQuery.gte("age", Math.min(minAge, maxAge)).lte("age", Math.max(minAge, maxAge));
  if (verifiedOnly) profileQuery = profileQuery.or("verification_status.eq.VERIFIED,verification_level.in.(LEVEL_3_PROFILE_BIOMETRIC,LEVEL_4_CREATOR)");
  if (recentlyActiveOnly) profileQuery = profileQuery.eq("show_online_status", true).gte("last_active_at", new Date(Date.now() - 86_400_000).toISOString());
  if (search) {
    const escaped = search.replace(/[%_,()]/g, "");
    if (escaped) profileQuery = profileQuery.or(`display_name.ilike.%${escaped}%,username.ilike.%${escaped}%,headline.ilike.%${escaped}%`);
  }

  const { data: profileRows, error: profileError, count } = await profileQuery;
  if (profileError) return NextResponse.json({ error: "Public profiles could not be loaded" }, { status: 502 });

  const profiles = (profileRows || []).map((row) => toAnonymousPublicProfile(row as PublicProfileRow));

  // Plans (Tonight) are members-only: time-and-place intent is never public.
  const datingAds: Array<Record<string, unknown>> = [];

  return NextResponse.json(
    {
      profiles,
      datingAds,
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: offset + profiles.length < (count || 0),
      },
      ranking: "created_at_desc_then_id_asc",
      privacy: "anonymous_minimized_public_records_only",
      demoContentPresent: profiles.some((profile) => profile.isDemo),
    },
    {
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
        "X-Content-Type-Options": "nosniff",
      },
    }
  );
}
