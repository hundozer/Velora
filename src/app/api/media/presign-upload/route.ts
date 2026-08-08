import { NextRequest, NextResponse } from "next/server";
import { getPresignedUploadUrl, isR2Configured } from "@/lib/storage/r2";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { auditLogger } from "@/lib/auth/auditLogger";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "video/mp4", "video/quicktime", "video/webm"]);
const ALLOWED_FOLDERS = new Set(["photos", "videos", "avatars", "covers", "general"]);
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 250 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });

  const rate = checkRateLimit(`media-presign:${actor.actor.auth0Sub}`, 20, 60);
  if (!rate.allowed) return NextResponse.json({ error: "Too many upload requests" }, { status: 429, headers: { "Retry-After": String(rate.resetInSeconds) } });

  try {
    const body = await req.json();
    const fileName = typeof body.fileName === "string" ? body.fileName.trim() : "";
    const fileType = typeof body.fileType === "string" ? body.fileType.toLowerCase() : "";
    const fileSize = Number(body.fileSize);
    const folder = ALLOWED_FOLDERS.has(body.folder) ? body.folder : "general";
    const visibility = ["PUBLIC", "MEMBERS_ONLY", "FOLLOWERS_ONLY", "PRIVATE", "APPROVED_USERS_ONLY"].includes(body.visibility) ? body.visibility : "PRIVATE";
    const declaration = body.participantDeclaration;

    if (!fileName || fileName.length > 180 || !ALLOWED_MIME_TYPES.has(fileType)) {
      return NextResponse.json({ error: "Invalid file name or type" }, { status: 400 });
    }
    const maxBytes = fileType.startsWith("image/") ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
    if (!Number.isSafeInteger(fileSize) || fileSize <= 0 || fileSize > maxBytes) {
      return NextResponse.json({ error: "File size is invalid or exceeds the upload limit" }, { status: 400 });
    }
    if (process.env.NODE_ENV === "production" && !isR2Configured) {
      return NextResponse.json({ error: "Media storage is unavailable" }, { status: 503 });
    }

    if (!declaration || typeof declaration.containsOtherIdentifiableParticipants !== "boolean" || declaration.allParticipantsAdults !== true || declaration.recordingConsented !== true || declaration.publicationConsented !== true) {
      return NextResponse.json({ error: "Adult participant, recording, and publication declarations are required" }, { status: 400 });
    }

    const presigned = await getPresignedUploadUrl({ fileName, fileType, fileSize, folder });
    const supabase = getServerSupabase();
    if (!supabase) return NextResponse.json({ error: "Media service unavailable" }, { status: 503 });
    const mediaType = fileType.startsWith("video/") ? "VIDEO" : "IMAGE";
    const { data: media, error: mediaError } = await supabase.from("media_objects").insert({ owner_id: actor.actor.profileId, object_key: presigned.objectKey, media_type: mediaType, mime_type: fileType, byte_size: fileSize, visibility, upload_status: "PENDING" }).select("id").single();
    if (mediaError || !media) return NextResponse.json({ error: "Media metadata could not be created" }, { status: 502 });
    // Additive metadata from migration 20260814. Keeping this separate preserves
    // upload compatibility while a staging environment is between migrations.
    await supabase.from("media_objects").update({
      processing_status: mediaType === "VIDEO" ? "UPLOADING" : "READY",
      moderation_status: "PENDING_REVIEW",
      title: typeof body.title === "string" ? body.title.trim().slice(0, 160) || null : null,
      description: typeof body.description === "string" ? body.description.trim().slice(0, 4_000) || null : null,
      category: typeof body.category === "string" ? body.category.trim().slice(0, 100) || null : null,
      tags: Array.isArray(body.tags) ? body.tags.filter((tag: unknown): tag is string => typeof tag === "string").map((tag: string) => tag.trim().slice(0, 50)).filter(Boolean).slice(0, 20) : [],
    }).eq("id", media.id).eq("owner_id", actor.actor.profileId);
    const { error: declarationError } = await supabase.from("content_participant_declarations").insert({ media_id: media.id, uploader_id: actor.actor.profileId, contains_other_identifiable_participants: declaration.containsOtherIdentifiableParticipants, all_participants_adults: true, recording_consented: true, publication_consented: true, declaration_version: "participant-v1-draft" });
    if (declarationError) {
      await supabase.from("media_objects").delete().eq("id", media.id).eq("owner_id", actor.actor.profileId);
      return NextResponse.json({ error: "Participant declaration could not be recorded" }, { status: 502 });
    }
    auditLogger.logEvent({ actorId: actor.actor.auth0Sub, actorRole: actor.actor.role as any, action: "MEDIA_UPLOAD_PRESIGNED", resourceId: media.id, resourceType: "MEDIA", status: "SUCCESS", details: { fileType, fileSize, folder, visibility } });
    // The R2 bucket remains private. Even PUBLIC/MEMBERS_ONLY application
    // visibility is enforced by Intimo before issuing a short-lived R2 GET URL.
    return NextResponse.json({ success: true, uploadUrl: presigned.uploadUrl, objectKey: presigned.objectKey, mediaId: media.id, publicUrl: `/api/media/${media.id}`, isMock: presigned.isMock });
  } catch (error) {
    console.error("Presigned URL generation failed", error);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}
