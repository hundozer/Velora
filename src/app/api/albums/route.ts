import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { appendDurableAudit } from "@/lib/auth/durableAudit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await resolveServerActor(req);
  if (auth.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: auth.status === "unauthenticated" ? 401 : 503 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Albums unavailable" }, { status: 503 });
  const { data: albums, error } = await db.from("media_albums").select("id,title,description,category,tags,visibility,comment_policy,reactions_enabled,moderation_status,cover_media_id,published_at,created_at,updated_at").eq("owner_id", auth.actor.profileId).neq("moderation_status", "REMOVED").order("updated_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: "Album lookup failed" }, { status: 502 });
  const ids = (albums || []).map((album) => album.id);
  const { data: items } = ids.length ? await db.from("media_album_items").select("album_id,media_id,sort_order").in("album_id", ids).order("sort_order", { ascending: true }) : { data: [] };
  return NextResponse.json({ albums: (albums || []).map((album) => ({ ...album, mediaIds: (items || []).filter((item) => item.album_id === album.id).map((item) => item.media_id), coverUrl: album.cover_media_id ? `/api/media/${album.cover_media_id}` : null })) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: NextRequest) {
  const auth = await resolveServerActor(req);
  if (auth.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: auth.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(auth.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  if (!checkRateLimit(`album-create:${auth.actor.auth0Sub}`, 20, 60 * 60).allowed) return NextResponse.json({ error: "Album creation limit reached" }, { status: 429 });
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const visibility = ["PUBLIC","MEMBERS_ONLY","FOLLOWERS_ONLY","FRIENDS_ONLY","PRIVATE"].includes(body.visibility) ? body.visibility : "PRIVATE";
  const commentPolicy = ["MEMBERS","VERIFIED","FRIENDS","DISABLED"].includes(body.commentPolicy) ? body.commentPolicy : "MEMBERS";
  const reactionsEnabled = body.reactionsEnabled !== false;
  const tags = Array.isArray(body.tags) ? body.tags.filter((tag: unknown): tag is string => typeof tag === "string").map((tag: string) => tag.trim().slice(0, 50)).filter(Boolean).slice(0, 20) : [];
  if (!title || title.length > 160 || description.length > 4000 || category.length > 100) return NextResponse.json({ error: "Invalid album details" }, { status: 400 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Albums unavailable" }, { status: 503 });
  const { data, error } = await db.from("media_albums").insert({ owner_id: auth.actor.profileId, title, description: description || null, category: category || null, tags, visibility, comment_policy: commentPolicy, reactions_enabled: reactionsEnabled, moderation_status: "PENDING_REVIEW" }).select("id,title,description,category,tags,visibility,comment_policy,reactions_enabled,moderation_status,created_at").single();
  if (error || !data) return NextResponse.json({ error: "Album could not be created" }, { status: 502 });
  const audited = await appendDurableAudit(db, { actorProfileId: auth.actor.profileId, actorAuth0Sub: auth.actor.auth0Sub, action: "ALBUM_CREATE", resourceType: "ALBUM", resourceId: data.id, outcome: "SUCCESS", metadata: { visibility } });
  if (!audited) { await db.from("media_albums").delete().eq("id", data.id).eq("owner_id", auth.actor.profileId); return NextResponse.json({ error: "Album creation could not be audited" }, { status: 502 }); }
  return NextResponse.json({ album: { ...data, mediaIds: [], coverUrl: null } }, { status: 201 });
}
