import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type FeedItem = {
  id: string;
  type: "PROFILE" | "DATING_AD" | "POST" | "ALBUM" | "IMAGE" | "VIDEO";
  actor: { id: string; displayName: string; avatarUrl?: string; verified: boolean };
  title: string;
  body?: string;
  category?: string;
  mediaUrl?: string;
  href: string;
  occurredAt: string;
};

export async function GET(req: NextRequest) {
  const auth = await resolveServerActor(req);
  if (auth.status !== "authenticated") {
    return NextResponse.json({ error: "Authentication required" }, { status: auth.status === "unauthenticated" ? 401 : 503 });
  }
  if (!hasAdultAccess(auth.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  if (!checkRateLimit(`member-feed:${auth.actor.auth0Sub}`, 120, 60).allowed) {
    return NextResponse.json({ error: "Too many feed requests" }, { status: 429 });
  }
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Feed unavailable" }, { status: 503 });

  const url = new URL(req.url);
  const scope = ["newest", "followed", "friends"].includes(url.searchParams.get("scope") || "") ? url.searchParams.get("scope")! : "newest";
  const contentType = ["all", "albums", "photos", "videos", "posts", "dating"].includes(url.searchParams.get("type") || "") ? url.searchParams.get("type")! : "all";

  const [{ data: blocks, error: blockError }, { data: follows, error: followError }, { data: friendships, error: friendshipError }] = await Promise.all([
    db.from("user_blocks").select("blocker_id,blocked_profile_id").or(`blocker_id.eq.${auth.actor.profileId},blocked_profile_id.eq.${auth.actor.profileId}`),
    db.from("connections").select("followed_id").eq("follower_id", auth.actor.profileId).eq("connection_type", "follow"),
    db.from("friendships").select("requester_id,addressee_id").eq("status", "ACCEPTED")
      .or(`requester_id.eq.${auth.actor.profileId},addressee_id.eq.${auth.actor.profileId}`),
  ]);
  if (blockError || followError || friendshipError) return NextResponse.json({ error: "Feed audience unavailable" }, { status: 503 });
  const excluded = new Set<string>([auth.actor.profileId]);
  for (const block of blocks || []) {
    excluded.add(block.blocker_id === auth.actor.profileId ? block.blocked_profile_id : block.blocker_id);
  }

  let audienceIds: string[] | null = null;
  if (scope === "followed") audienceIds = (follows || []).map((row) => row.followed_id).filter((id) => !excluded.has(id));
  if (scope === "friends") audienceIds = (friendships || []).map((row) => row.requester_id === auth.actor.profileId ? row.addressee_id : row.requester_id).filter((id) => !excluded.has(id));
  if (audienceIds && audienceIds.length === 0) {
    return NextResponse.json({ items: [], scope, contentType, ranking: "occurred_at_desc_then_id_asc" }, { headers: { "Cache-Control": "private, no-store" } });
  }

  let profileQuery = db.from("profiles")
    .select("id,display_name,username,avatar_url,verification_status,verification_level,headline,created_at")
    .eq("account_status", "ACTIVE").eq("discovery_disabled", false)
    .in("profile_visibility", scope === "friends" ? ["EVERYONE", "MEMBERS_ONLY", "FRIENDS_ONLY"] : ["EVERYONE", "MEMBERS_ONLY"])
    .order("created_at", { ascending: false }).limit(40);
  let adQuery = db.from("dating_ads").select("id,author_id,title,text,category,created_at,validity_days")
    .eq("status", "active").order("created_at", { ascending: false }).limit(40);
  let postQuery = db.from("content_posts").select("id,author_id,title,body,category,visibility,published_at,created_at")
    .in("visibility", scope === "followed" ? ["PUBLIC", "MEMBERS_ONLY", "FOLLOWERS_ONLY"] : ["PUBLIC", "MEMBERS_ONLY"])
    .eq("moderation_status", "APPROVED").order("published_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(40);
  let albumQuery = db.from("media_albums").select("id,owner_id,title,description,category,visibility,cover_media_id,published_at,created_at")
    .in("visibility", scope === "followed" ? ["PUBLIC", "MEMBERS_ONLY", "FOLLOWERS_ONLY"] : ["PUBLIC", "MEMBERS_ONLY"])
    .eq("moderation_status", "APPROVED").order("published_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(40);
  let mediaQuery = db.from("media_objects").select("id,owner_id,media_type,title,description,category,visibility,published_at,created_at")
    .in("visibility", scope === "followed" ? ["PUBLIC", "MEMBERS_ONLY", "FOLLOWERS_ONLY"] : ["PUBLIC", "MEMBERS_ONLY"])
    .eq("upload_status", "AVAILABLE").eq("processing_status", "READY").eq("moderation_status", "APPROVED")
    .order("published_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(40);
  if (audienceIds) {
    profileQuery = profileQuery.in("id", audienceIds);
    adQuery = adQuery.in("author_id", audienceIds);
    postQuery = postQuery.in("author_id", audienceIds);
    albumQuery = albumQuery.in("owner_id", audienceIds);
    mediaQuery = mediaQuery.in("owner_id", audienceIds);
  }

  const [{ data: profileRows }, { data: adRows }, { data: postRows }, { data: albumRows }, { data: mediaRows }] = await Promise.all([profileQuery, adQuery, postQuery, albumQuery, mediaQuery]);

  const ownerIds = new Set<string>();
  for (const row of adRows || []) ownerIds.add(row.author_id);
  for (const row of postRows || []) ownerIds.add(row.author_id);
  for (const row of albumRows || []) ownerIds.add(row.owner_id);
  for (const row of mediaRows || []) ownerIds.add(row.owner_id);
  for (const row of profileRows || []) ownerIds.add(row.id);
  for (const id of excluded) ownerIds.delete(id);

  const { data: owners } = ownerIds.size ? await db.from("profiles")
    .select("id,display_name,username,avatar_url,verification_status,verification_level,account_status,discovery_disabled")
    .in("id", Array.from(ownerIds)).eq("account_status", "ACTIVE").eq("discovery_disabled", false) : { data: [] };
  const ownerMap = new Map((owners || []).map((owner) => [owner.id, owner]));
  const actorFor = (id: string) => {
    const owner = ownerMap.get(id);
    if (!owner) return null;
    return {
      id: owner.id,
      displayName: owner.display_name || owner.username || "Intimo member",
      avatarUrl: owner.avatar_url || undefined,
      verified: owner.verification_status === "VERIFIED" || ["LEVEL_3_PROFILE_BIOMETRIC", "LEVEL_4_CREATOR"].includes(owner.verification_level || ""),
    };
  };

  const items: FeedItem[] = [];
  for (const profile of profileRows || []) {
    const actor = actorFor(profile.id); if (!actor) continue;
    items.push({ id: `PROFILE:${profile.id}`, type: "PROFILE", actor, title: `${actor.displayName} joined Intimo`, body: profile.headline || undefined, href: `/profile/${profile.id}`, occurredAt: profile.created_at });
  }
  const now = Date.now();
  for (const ad of adRows || []) {
    const actor = actorFor(ad.author_id); if (!actor || new Date(ad.created_at).getTime() + Number(ad.validity_days || 0) * 86_400_000 <= now) continue;
    items.push({ id: `DATING_AD:${ad.id}`, type: "DATING_AD", actor, title: ad.title, body: ad.text, category: ad.category, href: `/dating?ad=${encodeURIComponent(ad.id)}`, occurredAt: ad.created_at });
  }
  for (const post of postRows || []) {
    const actor = actorFor(post.author_id); if (!actor) continue;
    items.push({ id: `POST:${post.id}`, type: "POST", actor, title: post.title || `${actor.displayName} shared an update`, body: post.body, category: post.category || undefined, href: `/search?q=${encodeURIComponent(post.title || actor.displayName)}`, occurredAt: post.published_at || post.created_at });
  }
  for (const album of albumRows || []) {
    const actor = actorFor(album.owner_id); if (!actor) continue;
    items.push({ id: `ALBUM:${album.id}`, type: "ALBUM", actor, title: album.title, body: album.description || undefined, category: album.category || undefined, mediaUrl: album.cover_media_id ? `/api/media/${album.cover_media_id}` : undefined, href: `/album/${album.id}`, occurredAt: album.published_at || album.created_at });
  }
  for (const media of mediaRows || []) {
    const actor = actorFor(media.owner_id); if (!actor || !["IMAGE", "VIDEO"].includes(media.media_type)) continue;
    const type = media.media_type as "IMAGE" | "VIDEO";
    items.push({ id: `${type}:${media.id}`, type, actor, title: media.title || `${actor.displayName} added a new ${type === "IMAGE" ? "photo" : "video"}`, body: media.description || undefined, category: media.category || undefined, mediaUrl: `/api/media/${media.id}`, href: type === "IMAGE" ? "/photos" : "/videos", occurredAt: media.published_at || media.created_at });
  }

  const permittedTypes: Record<string, FeedItem["type"][]> = { albums: ["ALBUM"], photos: ["IMAGE"], videos: ["VIDEO"], posts: ["POST"], dating: ["DATING_AD"] };
  const filtered = contentType === "all" ? items : items.filter((item) => permittedTypes[contentType]?.includes(item.type));
  filtered.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt) || a.id.localeCompare(b.id));
  return NextResponse.json({ items: filtered.slice(0, 60), scope, contentType, ranking: "occurred_at_desc_then_id_asc" }, { headers: { "Cache-Control": "private, no-store" } });
}
