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
  const rate = checkRateLimit(`public-community:${clientKey(req)}`, 90, 60);
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
  const profileType = url.searchParams.get("profileType");

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
  if (profileType === "COUPLE") profileQuery = profileQuery.eq("is_couple_profile", true);
  if (profileType === "INDIVIDUAL") profileQuery = profileQuery.eq("is_couple_profile", false);
  if (search) {
    const escaped = search.replace(/[%_,()]/g, "");
    if (escaped) profileQuery = profileQuery.or(`display_name.ilike.%${escaped}%,username.ilike.%${escaped}%,headline.ilike.%${escaped}%`);
  }

  const { data: profileRows, error: profileError, count } = await profileQuery;
  if (profileError) return NextResponse.json({ error: "Public profiles could not be loaded" }, { status: 502 });

  const profiles = (profileRows || []).map((row) => toAnonymousPublicProfile(row as PublicProfileRow));

  const { data: adRows, error: adError } = await db
    .from("dating_ads")
    .select("id,author_id,title,category,country,region,min_age,max_age,created_at,validity_days")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(12);

  let datingAds: Array<Record<string, unknown>> = [];
  if (!adError && adRows?.length) {
    const authorIds = Array.from(new Set(adRows.map((row) => row.author_id)));
    const { data: publicAuthors } = await db
      .from("profiles")
      .select("id,display_name,username,verification_status,verification_level")
      .in("id", authorIds)
      .eq("profile_visibility", "EVERYONE")
      .eq("public_profile_visibility", true)
      .eq("account_status", "ACTIVE")
      .eq("discovery_disabled", false);
    const authorMap = new Map((publicAuthors || []).map((author) => [author.id, author]));
    const now = Date.now();
    datingAds = adRows.flatMap((ad) => {
      const author = authorMap.get(ad.author_id);
      const expiresAt = new Date(ad.created_at).getTime() + ad.validity_days * 86_400_000;
      if (!author || expiresAt <= now) return [];
      return [{
        id: ad.id,
        authorId: ad.author_id,
        authorName: author.display_name || author.username || "Intimo member",
        verified: author.verification_status === "VERIFIED" || ["LEVEL_3_PROFILE_BIOMETRIC", "LEVEL_4_CREATOR"].includes(author.verification_level || ""),
        title: String(ad.title || "").slice(0, 120),
        category: String(ad.category || "").slice(0, 80),
        location: [ad.region, ad.country].filter(Boolean).join(", ").slice(0, 160) || undefined,
        ageRange: `${ad.min_age}–${ad.max_age}`,
        createdAt: ad.created_at,
      }];
    });
  }

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
    },
    {
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
        "X-Content-Type-Options": "nosniff",
      },
    }
  );
}
