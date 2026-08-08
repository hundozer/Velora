import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";

export const dynamic = "force-dynamic";

function cleanQuery(value: string | null) {
  return (value || "").trim().replace(/[%_,()]/g, "").slice(0, 80);
}

export async function GET(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Active adult access required" }, { status: 403 });
  const q = cleanQuery(new URL(req.url).searchParams.get("q"));
  if (q.length < 2) return NextResponse.json({ error: "Enter at least two characters" }, { status: 400 });
  const rate = checkRateLimit(`search:${actor.actor.auth0Sub}`, 60, 60);
  if (!rate.allowed) return NextResponse.json({ error: "Too many search requests" }, { status: 429, headers: { "Retry-After": String(rate.resetInSeconds) } });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Search unavailable" }, { status: 503 });

  const { data: blockRows } = await db.from("user_blocks").select("blocker_id,blocked_profile_id").or(`blocker_id.eq.${actor.actor.profileId},blocked_profile_id.eq.${actor.actor.profileId}`);
  const blocked = new Set((blockRows || []).map((row) => row.blocker_id === actor.actor.profileId ? row.blocked_profile_id : row.blocker_id));
  blocked.add(actor.actor.profileId);
  const pattern = `%${q}%`;

  const [profileResult, mediaResult, adResult, postResult] = await Promise.all([
    db.from("profiles").select("id,display_name,username,avatar_url,age,country,city,headline,is_couple_profile,verification_status,verification_level")
      .eq("account_status", "ACTIVE").eq("discovery_disabled", false).in("profile_visibility", ["EVERYONE", "MEMBERS_ONLY"])
      .or(`display_name.ilike.${pattern},username.ilike.${pattern},headline.ilike.${pattern}`).order("created_at", { ascending: false }).order("id", { ascending: true }).limit(16),
    db.from("media_objects").select("id,owner_id,media_type,title,description,category,published_at,created_at")
      .eq("upload_status", "AVAILABLE").eq("processing_status", "READY").eq("moderation_status", "APPROVED").in("visibility", ["PUBLIC", "MEMBERS_ONLY"])
      .or(`title.ilike.${pattern},description.ilike.${pattern},category.ilike.${pattern}`).order("published_at", { ascending: false, nullsFirst: false }).order("id", { ascending: true }).limit(16),
    db.from("dating_ads").select("id,author_id,title,category,country,region,min_age,max_age,created_at,validity_days")
      .eq("status", "active").or(`title.ilike.${pattern},text.ilike.${pattern},category.ilike.${pattern},country.ilike.${pattern},region.ilike.${pattern}`).order("created_at", { ascending: false }).order("id", { ascending: true }).limit(16),
    db.from("content_posts").select("id,author_id,post_type,title,body,category,visibility,published_at,created_at")
      .eq("moderation_status", "APPROVED").in("visibility", ["PUBLIC", "MEMBERS_ONLY"])
      .or(`title.ilike.${pattern},body.ilike.${pattern},category.ilike.${pattern}`).order("published_at", { ascending: false, nullsFirst: false }).order("id", { ascending: true }).limit(16),
  ]);

  if (profileResult.error || mediaResult.error || adResult.error) return NextResponse.json({ error: "Search lookup failed" }, { status: 502 });
  const ownerIds = Array.from(new Set([
    ...(mediaResult.data || []).map((row) => row.owner_id),
    ...(adResult.data || []).map((row) => row.author_id),
    ...(postResult.data || []).map((row) => row.author_id),
  ])).filter((id) => !blocked.has(id));
  const { data: ownerRows } = ownerIds.length ? await db.from("profiles").select("id,display_name,username,account_status,discovery_disabled").in("id", ownerIds) : { data: [] };
  const owners = new Map((ownerRows || []).filter((owner) => owner.account_status === "ACTIVE" && !owner.discovery_disabled).map((owner) => [owner.id, owner]));
  const author = (id: string) => owners.get(id)?.display_name || owners.get(id)?.username || "Intimo member";

  return NextResponse.json({
    query: q,
    people: (profileResult.data || []).filter((row) => !blocked.has(row.id)).map((row) => ({ id: row.id, displayName: row.display_name || row.username || "Intimo member", avatarUrl: row.avatar_url, age: row.age, location: [row.city, row.country].filter(Boolean).join(", "), headline: row.headline, profileType: row.is_couple_profile ? "COUPLE" : "INDIVIDUAL", verified: row.verification_status === "VERIFIED" || ["LEVEL_3_PROFILE_BIOMETRIC", "LEVEL_4_CREATOR"].includes(row.verification_level || "") })),
    media: (mediaResult.data || []).filter((row) => owners.has(row.owner_id)).map((row) => ({ id: row.id, type: row.media_type, title: row.title || (row.media_type === "VIDEO" ? "Untitled video" : "Untitled photo"), description: row.description, category: row.category, ownerId: row.owner_id, ownerName: author(row.owner_id), mediaUrl: `/api/media/${row.id}`, publishedAt: row.published_at || row.created_at })),
    datingAds: (adResult.data || []).filter((row) => owners.has(row.author_id) && new Date(row.created_at).getTime() + row.validity_days * 86_400_000 > Date.now()).map((row) => ({ id: row.id, title: row.title, category: row.category, authorId: row.author_id, authorName: author(row.author_id), location: [row.region, row.country].filter(Boolean).join(", "), ageRange: `${row.min_age}–${row.max_age}`, createdAt: row.created_at })),
    posts: postResult.error ? [] : (postResult.data || []).filter((row) => owners.has(row.author_id)).map((row) => ({ id: row.id, type: row.post_type, title: row.title, excerpt: String(row.body || "").slice(0, 240), category: row.category, authorId: row.author_id, authorName: author(row.author_id), publishedAt: row.published_at || row.created_at })),
    ranking: "category_then_published_or_created_desc_then_id_asc",
  }, { headers: { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" } });
}
