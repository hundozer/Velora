import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { deleteStoredObject, deleteVariantObjects } from "@/lib/storage/r2";
import { parseRequestedWidth, pickVariantWidth } from "@/lib/media/variants.mjs";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { appendDurableAudit } from "@/lib/auth/durableAudit";
import { deliverMedia } from "@/lib/media/delivery";
import { grantIsActive } from "@/lib/privateAccess.mjs";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Invalid media identifier" }, { status: 400 });
  const requestedWidth = parseRequestedWidth(req.nextUrl.searchParams.get("w"));
  // Thumbnails are small and requested in bulk by lists; they get their own budget.
  const rate = requestedWidth === 160
    ? (await checkRateLimit(`media-view-thumb:${actor.actor.userId}`, 600, 60))
    : (await checkRateLimit(`media-view:${actor.actor.userId}`, 120, 60));
  if (!rate.allowed) return NextResponse.json({ error: "Media access rate limit reached" }, { status: 429 });
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Media service unavailable" }, { status: 503 });
  const modern = await supabase.from("media_objects").select("id,owner_id,object_key,visibility,upload_status,moderation_status,processing_status,category,mime_type").eq("id", params.id).maybeSingle();
  const legacy = modern.error
    ? await supabase.from("media_objects").select("id,owner_id,object_key,visibility,upload_status,mime_type,category").eq("id", params.id).maybeSingle()
    : null;
  const media = modern.data || legacy?.data;
  if (!media || media.upload_status !== "AVAILABLE") return NextResponse.json({ error: "Media not found" }, { status: 404 });
  if (media.mime_type.startsWith("video/") && !media.object_key.startsWith(`variants/${media.id}/safe.`)) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  if ("category" in media && media.category === "STORY") return NextResponse.json({ error: "Media not found" }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  const isOwner = media.owner_id === actor.actor.profileId;
  const moderationStatus = "moderation_status" in media ? media.moderation_status : null;
  const processingStatus = "processing_status" in media ? media.processing_status : null;
  // Chat photos (P1-10) are private 1:1 media: visible to the two participants without
  // waiting for proactive review, unless a moderator rejected, hid or removed them.
  const isChatImage = "category" in media && media.category === "MESSAGE";
  let chatParticipant = false;
  if (isChatImage && !isOwner && !["REJECTED", "HIDDEN", "REMOVED"].includes(String(moderationStatus))) {
    const { data: message } = await supabase.from("direct_messages").select("id").eq("media_url", `/api/media/${media.id}`).eq("sender_id", media.owner_id).eq("receiver_id", actor.actor.profileId).limit(1).maybeSingle();
    chatParticipant = Boolean(message) && processingStatus === "READY";
  }
  if (moderationStatus === "REMOVED" || (!isOwner && !chatParticipant && (moderationStatus !== "APPROVED" || processingStatus !== "READY"))) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }
  const { data: block, error: blockError } = isOwner ? { data: null, error: null } : await supabase.from("user_blocks").select("id").or(`and(blocker_id.eq.${actor.actor.profileId},blocked_profile_id.eq.${media.owner_id}),and(blocker_id.eq.${media.owner_id},blocked_profile_id.eq.${actor.actor.profileId})`).limit(1).maybeSingle();
  if (blockError || block) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  if (!isOwner) {
    const { data: owner, error: ownerError } = await supabase.from("profiles")
      .select("account_status,discovery_disabled").eq("id", media.owner_id).maybeSingle();
    if (ownerError || !owner || owner.account_status !== "ACTIVE" || owner.discovery_disabled) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }
  }
  let allowed = isOwner || chatParticipant || (!isChatImage && (media.visibility === "PUBLIC" || media.visibility === "MEMBERS_ONLY"));
  if (!allowed && media.visibility === "FOLLOWERS_ONLY") {
    const { data: follow } = await supabase.from("connections").select("id").eq("follower_id", actor.actor.profileId).eq("followed_id", media.owner_id).eq("connection_type", "follow").maybeSingle();
    allowed = Boolean(follow);
  }
  if (!allowed && media.visibility === "APPROVED_USERS_ONLY") {
    const { data: approved } = await supabase.from("connections").select("id").eq("follower_id", media.owner_id).eq("followed_id", actor.actor.profileId).eq("connection_type", "favorite").maybeSingle();
    allowed = Boolean(approved);
  }
  if (!allowed && media.visibility === "PRIVATE" && !isChatImage) {
    // Private Album Handshake (P1-06): checked on every read, so revoking is immediate.
    const { data: grant, error: grantError } = await supabase.from("album_access_grants").select("status,grant_type,expires_at").eq("owner_id", media.owner_id).eq("viewer_id", actor.actor.profileId).maybeSingle();
    if (grantError) return NextResponse.json({ error: "Media not found" }, { status: 404 });
    allowed = grantIsActive(grant);
    if (!allowed) {
      // An approved member album can contain photos uploaded while it was private.
      // The album, link and owner are checked on every read; private standalone photos stay private.
      const { data: links, error: linkError } = await supabase.from("media_album_items").select("album_id").eq("media_id", media.id).limit(30);
      if (linkError) return NextResponse.json({ error: "Media not found" }, { status: 404 });
      const ids = (links || []).map(link => link.album_id);
      if (ids.length) {
        const { data: albums, error: albumError } = await supabase.from("media_albums").select("id").in("id", ids).eq("owner_id", media.owner_id).eq("visibility", "MEMBERS_ONLY").eq("moderation_status", "APPROVED").limit(1);
        if (albumError) return NextResponse.json({ error: "Media not found" }, { status: 404 });
        allowed = Boolean(albums?.length);
      }
    }
  }
  if (!allowed) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  // Authorisation is complete. Pick a resized variant when one exists (variants are read
  // separately so this route keeps working before the variants migration is applied).
  let objectKey = media.object_key;
  if (requestedWidth) {
    const { data: stored } = await supabase.from("media_objects").select("variants").eq("id", media.id).maybeSingle();
    const variants = (stored as { variants?: Record<string, string> | null } | null)?.variants;
    const width = pickVariantWidth(variants, requestedWidth);
    if (width && variants?.[String(width)]) objectKey = variants[String(width)];
  }
  // Recheck authorization on every fetch. A no-store redirect still leaked a reusable
  // five-minute storage URL; proxy bytes instead so revoke/block/delete stop future reads.
  try {
    return await deliverMedia(objectKey, media.mime_type, req.headers.get("range") || undefined);
  } catch {
    return NextResponse.json({ error: "Private media unavailable" }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
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
  const { data: existing, error: existingError } = await db.from("media_objects").select("category").eq("id", params.id).eq("owner_id", actor.actor.profileId).maybeSingle();
  if (existingError) return NextResponse.json({ error: "Media lookup failed" }, { status: 502 });
  if (existing?.category === "STORY" || category === "STORY") return NextResponse.json({ error: "Manage story photos in Stories" }, { status: 409 });
  const { data, error } = await db.from("media_objects").update({ title: title || null, description: description || null, category: category || null, tags, visibility, moderation_status: "PENDING_REVIEW", published_at: null, updated_at: new Date().toISOString() }).eq("id", params.id).eq("owner_id", actor.actor.profileId).neq("upload_status", "REMOVED").select("id,title,description,category,tags,visibility,moderation_status,processing_status,upload_status").maybeSingle();
  if (error) return NextResponse.json({ error: "Media update failed" }, { status: 502 }); if (!data) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  const audited = await appendDurableAudit(db, { actorProfileId: actor.actor.profileId, actorUserId: actor.actor.userId, action: "MEDIA_UPDATE", resourceType: "MEDIA", resourceId: data.id, outcome: "SUCCESS", metadata: { visibility } });
  if (!audited) return NextResponse.json({ error: "Media was updated but audit evidence failed", mediaId: data.id }, { status: 502 });
  return NextResponse.json({ media: data });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = await resolveServerActor(req); if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Media service unavailable" }, { status: 503 });
  const { data: media } = await db.from("media_objects").select("id,object_key,variants").eq("id", params.id).eq("owner_id", actor.actor.profileId).maybeSingle(); if (!media) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  try { await deleteStoredObject(media.object_key); const source = (media.variants as { source?: string } | null)?.source; if (source) await deleteStoredObject(source); await deleteVariantObjects(media.id); } catch { return NextResponse.json({ error: "Stored media could not be removed" }, { status: 502 }); }
  const { error } = await db.from("media_objects").delete().eq("id", media.id).eq("owner_id", actor.actor.profileId); if (error) return NextResponse.json({ error: "Media metadata could not be removed" }, { status: 502 });
  const audited = await appendDurableAudit(db, { actorProfileId: actor.actor.profileId, actorUserId: actor.actor.userId, action: "MEDIA_DELETE", resourceType: "MEDIA", resourceId: media.id, outcome: "SUCCESS" });
  if (!audited) return NextResponse.json({ error: "Media was deleted but audit evidence failed", mediaId: media.id }, { status: 502 });
  return NextResponse.json({ success: true });
}
