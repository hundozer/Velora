import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { deleteStoredObject, getPresignedDownloadUrl } from "@/lib/storage/r2";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { appendDurableAudit } from "@/lib/auth/durableAudit";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Invalid media identifier" }, { status: 400 });
  const rate = checkRateLimit(`media-view:${actor.actor.auth0Sub}`, 120, 60);
  if (!rate.allowed) return NextResponse.json({ error: "Media access rate limit reached" }, { status: 429 });
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Media service unavailable" }, { status: 503 });
  const modern = await supabase.from("media_objects").select("id,owner_id,object_key,visibility,upload_status,moderation_status,processing_status").eq("id", params.id).maybeSingle();
  const legacy = modern.error
    ? await supabase.from("media_objects").select("id,owner_id,object_key,visibility,upload_status").eq("id", params.id).maybeSingle()
    : null;
  const media = modern.data || legacy?.data;
  if (!media || media.upload_status !== "AVAILABLE") return NextResponse.json({ error: "Media not found" }, { status: 404 });
  const isOwner = media.owner_id === actor.actor.profileId;
  const moderationStatus = "moderation_status" in media ? media.moderation_status : null;
  const processingStatus = "processing_status" in media ? media.processing_status : null;
  if (moderationStatus === "REMOVED" || (!isOwner && (moderationStatus !== "APPROVED" || processingStatus !== "READY"))) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }
  const { data: block } = isOwner ? { data: null } : await supabase.from("user_blocks").select("id").or(`and(blocker_id.eq.${actor.actor.profileId},blocked_profile_id.eq.${media.owner_id}),and(blocker_id.eq.${media.owner_id},blocked_profile_id.eq.${actor.actor.profileId})`).limit(1).maybeSingle();
  if (block) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  let allowed = isOwner || media.visibility === "PUBLIC" || media.visibility === "MEMBERS_ONLY";
  if (!allowed && media.visibility === "FOLLOWERS_ONLY") {
    const { data: follow } = await supabase.from("connections").select("id").eq("follower_id", actor.actor.profileId).eq("followed_id", media.owner_id).eq("connection_type", "follow").maybeSingle();
    allowed = Boolean(follow);
  }
  if (!allowed && media.visibility === "APPROVED_USERS_ONLY") {
    const { data: approved } = await supabase.from("connections").select("id").eq("follower_id", media.owner_id).eq("followed_id", actor.actor.profileId).eq("connection_type", "favorite").maybeSingle();
    allowed = Boolean(approved);
  }
  if (!allowed) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  try {
    const signedUrl = await getPresignedDownloadUrl(media.object_key);
    const response = NextResponse.redirect(signedUrl, 307);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch {
    return NextResponse.json({ error: "Private media unavailable" }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = await resolveServerActor(req); if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const title = typeof body.title === "string" ? body.title.trim() : ""; const description = typeof body.description === "string" ? body.description.trim() : ""; const category = typeof body.category === "string" ? body.category.trim() : "";
  const visibility = ["PUBLIC","MEMBERS_ONLY","FOLLOWERS_ONLY","PRIVATE","APPROVED_USERS_ONLY"].includes(body.visibility) ? body.visibility : "PRIVATE";
  const tags = Array.isArray(body.tags) ? body.tags.filter((tag: unknown): tag is string => typeof tag === "string").map((tag: string) => tag.trim().slice(0,50)).filter(Boolean).slice(0,20) : [];
  if (title.length > 160 || description.length > 4000 || category.length > 100) return NextResponse.json({ error: "Invalid media details" }, { status: 400 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Media service unavailable" }, { status: 503 });
  const { data, error } = await db.from("media_objects").update({ title: title || null, description: description || null, category: category || null, tags, visibility, moderation_status: "PENDING_REVIEW", published_at: null, updated_at: new Date().toISOString() }).eq("id", params.id).eq("owner_id", actor.actor.profileId).neq("upload_status", "REMOVED").select("id,title,description,category,tags,visibility,moderation_status,processing_status,upload_status").maybeSingle();
  if (error) return NextResponse.json({ error: "Media update failed" }, { status: 502 }); if (!data) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  const audited = await appendDurableAudit(db, { actorProfileId: actor.actor.profileId, actorAuth0Sub: actor.actor.auth0Sub, action: "MEDIA_UPDATE", resourceType: "MEDIA", resourceId: data.id, outcome: "SUCCESS", metadata: { visibility } });
  if (!audited) return NextResponse.json({ error: "Media was updated but audit evidence failed", mediaId: data.id }, { status: 502 });
  return NextResponse.json({ media: data });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = await resolveServerActor(req); if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Media service unavailable" }, { status: 503 });
  const { data: media } = await db.from("media_objects").select("id,object_key").eq("id", params.id).eq("owner_id", actor.actor.profileId).maybeSingle(); if (!media) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  try { await deleteStoredObject(media.object_key); } catch { return NextResponse.json({ error: "Stored media could not be removed" }, { status: 502 }); }
  const { error } = await db.from("media_objects").delete().eq("id", media.id).eq("owner_id", actor.actor.profileId); if (error) return NextResponse.json({ error: "Media metadata could not be removed" }, { status: 502 });
  const audited = await appendDurableAudit(db, { actorProfileId: actor.actor.profileId, actorAuth0Sub: actor.actor.auth0Sub, action: "MEDIA_DELETE", resourceType: "MEDIA", resourceId: media.id, outcome: "SUCCESS" });
  if (!audited) return NextResponse.json({ error: "Media was deleted but audit evidence failed", mediaId: media.id }, { status: 502 });
  return NextResponse.json({ success: true });
}
