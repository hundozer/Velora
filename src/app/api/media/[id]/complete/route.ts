import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { deleteStoredObject, getPresignedDownloadUrl, getStoredObject, inspectStoredObject, putStoredObject } from "@/lib/storage/r2";
import { processMediaVariants } from "@/lib/media/variants.mjs";
import { MAX_VIDEO_BYTES, sanitizeVideo } from "@/lib/media/sanitizeVideo.mjs";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { appendDurableAudit } from "@/lib/auth/durableAudit";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const maxDuration = 300;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Invalid media identifier" }, { status: 400 });
  if (!(await checkRateLimit(`media-complete:${actor.actor.userId}`, 30, 60)).allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Media service unavailable" }, { status: 503 });
  const { data: media, error } = await supabase.from("media_objects").select("id,owner_id,object_key,mime_type,byte_size,upload_status").eq("id", params.id).eq("owner_id", actor.actor.profileId).single();
  if (error || !media) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  if (media.upload_status === "AVAILABLE") return NextResponse.json({ success: true });
  if (media.upload_status !== "PENDING") return NextResponse.json({ error: "Media cannot be finalized" }, { status: 409 });
  try {
    const stored = await inspectStoredObject(media.object_key);
    if (!stored || stored.byteSize !== Number(media.byte_size) || stored.mimeType.toLowerCase() !== String(media.mime_type).toLowerCase()) {
      const { error: quarantineError } = await supabase.from("media_objects").update({ upload_status: "QUARANTINED", updated_at: new Date().toISOString() }).eq("id", media.id).eq("owner_id", actor.actor.profileId);
      if (quarantineError) return NextResponse.json({ error: "Stored object mismatch could not be quarantined" }, { status: 502 });
      const audited = await appendDurableAudit(supabase, { actorProfileId: actor.actor.profileId, actorUserId: actor.actor.userId, action: "MEDIA_UPLOAD_QUARANTINED", resourceType: "MEDIA", resourceId: media.id, outcome: "DENIED", metadata: { reason: "STORED_OBJECT_MISMATCH" } });
      if (!audited) return NextResponse.json({ error: "Upload quarantined but audit recording failed; contact support" }, { status: 503 });
      return NextResponse.json({ error: "Stored object did not match the authorized upload" }, { status: 422 });
    }
    if (media.mime_type.startsWith("video/")) {
      if (media.byte_size > MAX_VIDEO_BYTES || !["video/mp4", "video/webm"].includes(media.mime_type)) return NextResponse.json({ error: "This video format or size cannot be processed" }, { status: 422 });
      const safe = await sanitizeVideo(await getPresignedDownloadUrl(media.object_key), media.mime_type, Number(media.byte_size));
      const safeKey = `variants/${media.id}/safe.${media.mime_type === "video/mp4" ? "mp4" : "webm"}`;
      await putStoredObject(safeKey, safe, media.mime_type, "private, no-store");
      // The original key remains recorded for deletion and cannot be delivered
      // by the app once this atomic row update points to the sanitized copy.
      const { data: changed, error: safeError } = await supabase.from("media_objects").update({ object_key: safeKey, byte_size: safe.length, variants: { source: media.object_key }, variants_status: "READY", upload_status: "AVAILABLE", processing_status: "READY", moderation_status: "PENDING_REVIEW", updated_at: new Date().toISOString() }).eq("id", media.id).eq("owner_id", actor.actor.profileId).eq("upload_status", "PENDING").select("id").maybeSingle();
      if (safeError || !changed) return NextResponse.json({ error: "Video could not be finalized" }, { status: 502 });
      // A signed PUT can replay until expiry. Keep variants.source for erasure
      // even after this best-effort removal of the private original.
      await deleteStoredObject(media.object_key).catch(() => {});
    } else {
      const { error: updateError } = await supabase.from("media_objects").update({ upload_status: "AVAILABLE", updated_at: new Date().toISOString() }).eq("id", media.id).eq("owner_id", actor.actor.profileId).eq("upload_status", "PENDING");
      if (updateError) return NextResponse.json({ error: "Upload could not be finalized" }, { status: 502 });
      const { error: processingError } = await supabase.from("media_objects").update({ processing_status: "READY", moderation_status: "PENDING_REVIEW" }).eq("id", media.id).eq("owner_id", actor.actor.profileId);
      if (processingError) return NextResponse.json({ error: "Media processing state could not be initialized" }, { status: 502 });
    }
    const audited = await appendDurableAudit(supabase, { actorProfileId: actor.actor.profileId, actorUserId: actor.actor.userId, action: "MEDIA_UPLOAD_COMPLETED", resourceType: "MEDIA", resourceId: media.id, outcome: "SUCCESS", metadata: { mimeType: media.mime_type, byteSize: media.byte_size } });
    if (!audited) return NextResponse.json({ error: "Upload finalized but audit recording failed; contact support" }, { status: 503 });
    // Resized copies for fast photography. Best effort: on failure or timeout the original
    // is served as before and scripts/backfill-media-variants.mjs can retry.
    const variants = await processMediaVariants({
      media,
      readObject: getStoredObject,
      writeObject: putStoredObject,
      recordResult: async (result: { status: string; variants?: Record<string, string>; dominantColor?: string; lqip?: string }) => {
        const { error: variantError } = await supabase.from("media_objects").update({ variants_status: result.status, variants: result.variants ?? null, dominant_color: result.dominantColor ?? null, lqip: result.lqip ?? null }).eq("id", media.id);
        if (variantError) throw variantError;
      },
    });
    return NextResponse.json({ success: true, variants: variants.status });
  } catch {
    return NextResponse.json({ error: "Stored object could not be verified" }, { status: 502 });
  }
}
