import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { toAnonymousPublicProfile, type PublicProfileRow } from "@/lib/supabase/publicCommunity";

export const dynamic = "force-dynamic";

function queryText(value: string | null) {
  return (value || "").trim().replace(/[%_,()]/g, "").slice(0, 80);
}

export async function GET(req: NextRequest) {
  const q = queryText(new URL(req.url).searchParams.get("q"));
  if (q.length < 2) return NextResponse.json({ error: "Enter at least two characters" }, { status: 400 });
  const client = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rate = checkRateLimit(`public-search:${client.slice(0, 80)}`, 45, 60);
  if (!rate.allowed) return NextResponse.json({ error: "Too many search requests" }, { status: 429, headers: { "Retry-After": String(rate.resetInSeconds) } });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Search unavailable" }, { status: 503 });
  const pattern = `%${q}%`;

  const [profilesResult, mediaResult, albumsResult, adsResult] = await Promise.all([
    db.from("profiles").select("id,display_name,username,age,country,city,headline,bio,is_couple_profile,verification_status,verification_level,location_precision,show_online_status,last_active_at,created_at")
      .eq("profile_visibility", "EVERYONE").eq("public_profile_visibility", true).eq("account_status", "ACTIVE").eq("discovery_disabled", false)
      .or(`display_name.ilike.${pattern},username.ilike.${pattern},headline.ilike.${pattern}`).order("created_at", { ascending: false }).order("id", { ascending: true }).limit(16),
    db.from("media_objects").select("id,owner_id,media_type,title,description,category,published_at,created_at")
      .eq("visibility", "PUBLIC").eq("upload_status", "AVAILABLE").eq("processing_status", "READY").eq("moderation_status", "APPROVED")
      .or(`title.ilike.${pattern},description.ilike.${pattern},category.ilike.${pattern}`).order("published_at", { ascending: false, nullsFirst: false }).order("id", { ascending: true }).limit(16),
    db.from("media_albums").select("id,owner_id,title,description,category,published_at,created_at")
      .eq("visibility", "PUBLIC").eq("moderation_status", "APPROVED")
      .or(`title.ilike.${pattern},description.ilike.${pattern},category.ilike.${pattern}`).order("published_at", { ascending: false, nullsFirst: false }).order("id", { ascending: true }).limit(16),
    db.from("dating_ads").select("id,author_id,title,category,country,region,min_age,max_age,created_at,validity_days")
      .eq("status", "active").or(`title.ilike.${pattern},text.ilike.${pattern},category.ilike.${pattern},country.ilike.${pattern},region.ilike.${pattern}`).order("created_at", { ascending: false }).order("id", { ascending: true }).limit(16),
  ]);
  if (profilesResult.error || mediaResult.error || albumsResult.error || adsResult.error) return NextResponse.json({ error: "Search lookup failed" }, { status: 502 });

  const ownerIds = [...new Set([...(mediaResult.data || []).map((row) => row.owner_id), ...(albumsResult.data || []).map((row) => row.owner_id), ...(adsResult.data || []).map((row) => row.author_id)])];
  const { data: owners } = ownerIds.length ? await db.from("profiles").select("id,display_name,username,verification_status,verification_level").in("id", ownerIds).eq("profile_visibility", "EVERYONE").eq("public_profile_visibility", true).eq("account_status", "ACTIVE").eq("discovery_disabled", false) : { data: [] };
  const ownerMap = new Map((owners || []).map((owner) => [owner.id, owner]));
  const ownerName = (id: string) => ownerMap.get(id)?.display_name || ownerMap.get(id)?.username || "Intimo member";
  const now = Date.now();

  return NextResponse.json({
    query: q,
    people: (profilesResult.data || []).map((row) => toAnonymousPublicProfile(row as PublicProfileRow)),
    media: (mediaResult.data || []).filter((row) => ownerMap.has(row.owner_id)).map((row) => ({ id: row.id, type: row.media_type, title: row.title || (row.media_type === "VIDEO" ? "Untitled video" : "Untitled photo"), description: String(row.description || "").slice(0, 240), category: row.category, ownerId: row.owner_id, ownerName: ownerName(row.owner_id), mediaUrl: `/api/public/media/${row.id}`, publishedAt: row.published_at || row.created_at })),
    albums: (albumsResult.data || []).filter((row) => ownerMap.has(row.owner_id)).map((row) => ({ id: row.id, title: row.title, description: String(row.description || "").slice(0, 240), category: row.category, ownerId: row.owner_id, ownerName: ownerName(row.owner_id), publishedAt: row.published_at || row.created_at })),
    datingAds: (adsResult.data || []).filter((row) => ownerMap.has(row.author_id) && new Date(row.created_at).getTime() + row.validity_days * 86_400_000 > now).map((row) => ({ id: row.id, title: row.title, category: row.category, authorId: row.author_id, authorName: ownerName(row.author_id), location: [row.region, row.country].filter(Boolean).join(", "), ageRange: `${row.min_age}–${row.max_age}`, createdAt: row.created_at })),
    posts: [],
    ranking: "category_then_published_or_created_desc_then_id_asc",
    privacy: "anonymous_minimized_public_records_only",
  }, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120", "X-Robots-Tag": "noindex, follow", "X-Content-Type-Options": "nosniff" } });
}
