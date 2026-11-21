import { NextRequest, NextResponse } from "next/server";
import { isAdminActor, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { appendDurableAudit } from "@/lib/auth/durableAudit";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await resolveServerActor(req); if (auth.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: auth.status === "unauthenticated" ? 401 : 503 });
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Album not found" }, { status: 404 });
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const mediaIds = Array.isArray(body.mediaIds) ? body.mediaIds.filter((id: unknown): id is string => typeof id === "string" && UUID.test(id)) : [];
  const uniqueIds = [...new Set(mediaIds)]; const coverMediaId = typeof body.coverMediaId === "string" && UUID.test(body.coverMediaId) ? body.coverMediaId : null;
  if (uniqueIds.length !== mediaIds.length || uniqueIds.length > 30 || (coverMediaId && !uniqueIds.includes(coverMediaId))) return NextResponse.json({ error: "An album can contain no more than 30 photos" }, { status: 400 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Albums unavailable" }, { status: 503 });
  if (uniqueIds.length) {
    const { data: stories, error: storyError } = await db.from("media_objects").select("id").in("id", uniqueIds).in("category", ["STORY", "AGE_CHECK"]);
    if (storyError) return NextResponse.json({ error: "Photo lookup failed" }, { status: 502 });
    if (stories?.length) return NextResponse.json({ error: "Story photos cannot be added to albums" }, { status: 409 });
  }
  // Restricted albums may contain only PRIVATE photos. Reject mixed/public
  // photos rather than accidentally making the album cover or originals public.
  const { data: album, error: albumError } = await db.from("media_albums")
    .select("visibility").eq("id", params.id).eq("owner_id", auth.actor.profileId).maybeSingle();
  if (albumError || !album) return NextResponse.json({ error: "Album not found" }, { status: 404 });
  if (["PRIVATE_APPROVED", "PRIVATE"].includes(album.visibility) && uniqueIds.length) {
    const { data: photos, error: photosError } = await db.from("media_objects")
      .select("id,visibility,media_type,category").in("id", uniqueIds).eq("owner_id", auth.actor.profileId);
    if (photosError) return NextResponse.json({ error: "Photo lookup failed" }, { status: 502 });
    if (photos?.length !== uniqueIds.length || photos.some(photo =>
      photo.visibility !== "PRIVATE" || photo.media_type !== "IMAGE" ||
      ["MESSAGE","STORY","AGE_CHECK"].includes(photo.category || ""))) {
      return NextResponse.json({ error: "Private and Only-me albums can only contain your private photos." }, { status: 409 });
    }
  }
  const { error } = await db.rpc("intimo_set_album_media", { p_album_id: params.id, p_owner_id: auth.actor.profileId, p_media_ids: uniqueIds, p_cover_media_id: coverMediaId });
  if (error) {
    const reason = /invalid_album_media/.test(error.message) ? "One of these photos hasn't finished uploading or was removed. Refresh and try again."
      : /album_not_found/.test(error.message) ? "Album not found"
      : "Album media could not be updated";
    return NextResponse.json({ error: reason }, { status: 409 });
  }
  // Admin-owned albums can be published as soon as their photos are approved.
  // The RPC resets moderation to pending after every photo change; perform this
  // check afterwards and never publish an empty or not-ready album.
  let adminSelfApproved = false;
  if (isAdminActor(auth.actor) && uniqueIds.length > 0) {
    const { data: ready, error: readyError } = await db.from("media_objects")
      .select("id,visibility,media_type,upload_status,processing_status,moderation_status")
      .in("id", uniqueIds).eq("owner_id", auth.actor.profileId);
    if (readyError) return NextResponse.json({ error: "Album photos were saved but approval could not be checked; retry." }, { status: 502 });
    const allReady = ready?.length === uniqueIds.length && ready.every(photo =>
      photo.media_type === "IMAGE" && photo.upload_status === "AVAILABLE" &&
      photo.processing_status === "READY" && photo.moderation_status === "APPROVED" &&
      (!["PRIVATE_APPROVED", "PRIVATE"].includes(album.visibility) || photo.visibility === "PRIVATE") &&
      (album.visibility !== "MEMBERS_ONLY" || ["PRIVATE", "MEMBERS_ONLY", "PUBLIC"].includes(photo.visibility)));
    if (allReady) {
      const { error: approvalError } = await db.from("media_albums")
        .update({ moderation_status: "APPROVED", published_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("id", params.id).eq("owner_id", auth.actor.profileId).eq("moderation_status", "PENDING_REVIEW");
      if (approvalError) return NextResponse.json({ error: "Photos saved, but album approval failed; retry." }, { status: 502 });
      adminSelfApproved = true;
    }
  }
  const audited = await appendDurableAudit(db, { actorProfileId: auth.actor.profileId, actorUserId: auth.actor.userId, action: "ALBUM_MEDIA_SET", resourceType: "ALBUM", resourceId: params.id, outcome: "SUCCESS", metadata: { mediaCount: uniqueIds.length, coverMediaId, adminSelfApproved } });
  if (!audited) return NextResponse.json({ error: "Album media changed but audit evidence failed", albumId: params.id }, { status: 502 });
  return NextResponse.json({ success: true, moderationStatus: adminSelfApproved ? "APPROVED" : "PENDING_REVIEW" });
}
