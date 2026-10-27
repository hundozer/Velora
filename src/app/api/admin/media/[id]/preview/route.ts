import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission, requestSecurityMetadata } from "@/lib/auth/adminApi";
import { getServerSupabase } from "@/lib/supabase/server";
import { deliverMedia } from "@/lib/media/delivery";
import { checkRateLimit } from "@/lib/security/rateLimiter";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const noStore = { "Cache-Control": "private, no-store" };
const fail = (error: string, status: number) => NextResponse.json({ error }, { status, headers: noStore });

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // Separate moderation access: never relax the ordinary member media route.
  const auth = await requireAdminPermission(req, "content:reveal_sensitive");
  if ("response" in auth) return auth.response;
  if (!UUID.test(params.id)) return fail("Invalid media identifier", 400);
  const rate = (await checkRateLimit(`admin-media-preview:${auth.actor.userId}`, 240, 60));
  if (!rate.allowed) return fail("Preview rate limit reached", 429);
  const db = getServerSupabase();
  if (!db) return fail("Preview service unavailable", 503);
  const { data: media, error } = await db.from("media_objects")
    .select("id,owner_id,object_key,mime_type,media_type,category,upload_status,processing_status,moderation_status")
    .eq("id", params.id).maybeSingle();
  if (error) return fail("Preview lookup unavailable", 503);
  // Private chat photos are reviewed only in their reported-case workflow.
  const image = media?.media_type === "IMAGE" && media.mime_type?.startsWith("image/");
  const video = media?.media_type === "VIDEO" && ["video/mp4", "video/webm"].includes(media.mime_type) &&
    media.object_key.startsWith(`variants/${media.id}/safe.`);
  if (!media || media.category === "MESSAGE" || (!image && !video) || media.upload_status !== "AVAILABLE" ||
    media.processing_status !== "READY" || media.moderation_status === "REMOVED") {
    return fail("Media unavailable for preview", 404);
  }
  const { error: auditError } = await db.from("admin_action_events").insert({
    actor_profile_id: auth.actor.profileId, actor_role: auth.actor.role,
    action: "MEDIA_PREVIEW", category: "CONTENT_MODERATION", resource_type: "MEDIA", resource_id: media.id,
    reason: "Administrator explicitly opened media for moderation review.",
    previous_state: {}, new_state: {}, security_metadata: requestSecurityMetadata(req),
  });
  if (auditError) return fail("Preview audit unavailable", 503);
  try {
    // Proxy sanitized bytes. No original-upload fallback or reusable storage URL.
    return await deliverMedia(media.object_key, media.mime_type, video ? req.headers.get("range") || undefined : undefined);
  } catch {
    return fail("Media unavailable for preview", 503);
  }
}
