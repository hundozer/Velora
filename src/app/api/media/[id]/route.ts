import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { getPresignedDownloadUrl } from "@/lib/storage/r2";
import { checkRateLimit } from "@/lib/security/rateLimiter";

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
