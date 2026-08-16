import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { appendDurableAudit } from "@/lib/auth/durableAudit";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await resolveServerActor(req);
  if (auth.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: auth.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(auth.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Album not found" }, { status: 404 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Albums unavailable" }, { status: 503 });
  const { data: album } = await db.from("media_albums").select("id,owner_id,title,description,category,tags,visibility,comment_policy,reactions_enabled,moderation_status,cover_media_id,published_at,created_at").eq("id", params.id).maybeSingle();
  if (!album || album.moderation_status !== "APPROVED") return NextResponse.json({ error: "Album not found" }, { status: 404 });
  const isOwner = album.owner_id === auth.actor.profileId;
  const { data: block, error: blockError } = isOwner ? { data: null, error: null } : await db.from("user_blocks").select("id").or(`and(blocker_id.eq.${auth.actor.profileId},blocked_profile_id.eq.${album.owner_id}),and(blocker_id.eq.${album.owner_id},blocked_profile_id.eq.${auth.actor.profileId})`).limit(1).maybeSingle();
  if (blockError || block) return NextResponse.json({ error: "Album not found" }, { status: 404 });
  let allowed = isOwner || ["PUBLIC", "MEMBERS_ONLY"].includes(album.visibility);
  if (!allowed && album.visibility === "FOLLOWERS_ONLY") {
    const { data: follow } = await db.from("connections").select("id").eq("follower_id", auth.actor.profileId).eq("followed_id", album.owner_id).eq("connection_type", "follow").maybeSingle();
    allowed = Boolean(follow);
  }
  if (!allowed && album.visibility === "FRIENDS_ONLY") {
    const { data: friendship } = await db.from("friendships").select("id").eq("status", "ACCEPTED").or(`and(requester_id.eq.${auth.actor.profileId},addressee_id.eq.${album.owner_id}),and(requester_id.eq.${album.owner_id},addressee_id.eq.${auth.actor.profileId})`).limit(1).maybeSingle();
    allowed = Boolean(friendship);
  }
  if (!allowed) return NextResponse.json({ error: "Album not found" }, { status: 404 });
  const { data: owner } = await db.from("profiles").select("id,display_name,username,verification_status,verification_level,account_status,discovery_disabled").eq("id", album.owner_id).maybeSingle();
  if (!owner || (!isOwner && (owner.account_status !== "ACTIVE" || owner.discovery_disabled))) return NextResponse.json({ error: "Album not found" }, { status: 404 });
  const { data: links } = await db.from("media_album_items").select("media_id,sort_order").eq("album_id", album.id).order("sort_order", { ascending: true });
  const mediaIds = (links || []).map((link) => link.media_id);
  const { data: media } = mediaIds.length ? await db.from("media_objects").select("id,title,description,visibility,upload_status,processing_status,moderation_status").in("id", mediaIds).eq("owner_id", album.owner_id) : { data: [] };
  const mediaMap = new Map((media || []).filter((item) => item.upload_status === "AVAILABLE" && item.processing_status === "READY" && item.moderation_status === "APPROVED").map((item) => [item.id, item]));
  const photos = (links || []).flatMap((link) => { const item = mediaMap.get(link.media_id); return item ? [{ id: item.id, title: item.title || "Album photo", description: item.description, url: `/api/media/${item.id}` }] : []; });
  return NextResponse.json({ album: { id: album.id, title: album.title, description: album.description, category: album.category, tags: album.tags, commentPolicy: album.comment_policy, reactionsEnabled: album.reactions_enabled, owner: { id: owner.id, displayName: owner.display_name || owner.username || "Intimo member", verified: owner.verification_status === "VERIFIED" || ["LEVEL_3_PROFILE_BIOMETRIC", "LEVEL_4_CREATOR"].includes(owner.verification_level || "") }, photos } }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await resolveServerActor(req); if (auth.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: auth.status === "unauthenticated" ? 401 : 503 });
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Album not found" }, { status: 404 });
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const title = typeof body.title === "string" ? body.title.trim() : ""; const description = typeof body.description === "string" ? body.description.trim() : ""; const category = typeof body.category === "string" ? body.category.trim() : "";
  const visibility = ["PUBLIC","MEMBERS_ONLY","FOLLOWERS_ONLY","FRIENDS_ONLY","PRIVATE"].includes(body.visibility) ? body.visibility : "PRIVATE";
  const commentPolicy = ["MEMBERS","VERIFIED","FRIENDS","DISABLED"].includes(body.commentPolicy) ? body.commentPolicy : "MEMBERS";
  const reactionsEnabled = body.reactionsEnabled !== false;
  const tags = Array.isArray(body.tags) ? body.tags.filter((tag: unknown): tag is string => typeof tag === "string").map((tag: string) => tag.trim().slice(0,50)).filter(Boolean).slice(0,20) : [];
  if (!title || title.length > 160 || description.length > 4000 || category.length > 100) return NextResponse.json({ error: "Invalid album details" }, { status: 400 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Albums unavailable" }, { status: 503 });
  const { data, error } = await db.from("media_albums").update({ title, description: description || null, category: category || null, tags, visibility, comment_policy: commentPolicy, reactions_enabled: reactionsEnabled, moderation_status: "PENDING_REVIEW", published_at: null, updated_at: new Date().toISOString() }).eq("id", params.id).eq("owner_id", auth.actor.profileId).neq("moderation_status", "REMOVED").select("id,title,description,category,tags,visibility,comment_policy,reactions_enabled,moderation_status,cover_media_id,updated_at").maybeSingle();
  if (error) return NextResponse.json({ error: "Album update failed" }, { status: 502 }); if (!data) return NextResponse.json({ error: "Album not found" }, { status: 404 });
  const audited = await appendDurableAudit(db, { actorProfileId: auth.actor.profileId, actorAuth0Sub: auth.actor.auth0Sub, action: "ALBUM_UPDATE", resourceType: "ALBUM", resourceId: data.id, outcome: "SUCCESS", metadata: { visibility } });
  if (!audited) return NextResponse.json({ error: "Album was updated but audit evidence failed", albumId: data.id }, { status: 502 });
  return NextResponse.json({ album: data });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await resolveServerActor(req); if (auth.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: auth.status === "unauthenticated" ? 401 : 503 });
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Album not found" }, { status: 404 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Albums unavailable" }, { status: 503 });
  const { data, error } = await db.from("media_albums").update({ moderation_status: "REMOVED", visibility: "PRIVATE", published_at: null, updated_at: new Date().toISOString() }).eq("id", params.id).eq("owner_id", auth.actor.profileId).neq("moderation_status", "REMOVED").select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Album removal failed" }, { status: 502 }); if (!data) return NextResponse.json({ error: "Album not found" }, { status: 404 });
  const audited = await appendDurableAudit(db, { actorProfileId: auth.actor.profileId, actorAuth0Sub: auth.actor.auth0Sub, action: "ALBUM_REMOVE", resourceType: "ALBUM", resourceId: data.id, outcome: "SUCCESS" });
  if (!audited) return NextResponse.json({ error: "Album was removed but audit evidence failed", albumId: data.id }, { status: 502 });
  return NextResponse.json({ success: true });
}
