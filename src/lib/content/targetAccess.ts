import { getServerSupabase } from "@/lib/supabase/server";
import type { ServerActor } from "@/lib/auth/serverActor";

export const CONTENT_TARGET_TYPES = ["PROFILE", "MEDIA", "POST", "DATING_AD"] as const;
export type ContentTargetType = (typeof CONTENT_TARGET_TYPES)[number];

export async function resolveContentTarget(actor: ServerActor, targetType: ContentTargetType, targetId: string) {
  const db = getServerSupabase();
  if (!db) return { allowed: false as const, status: 503, error: "Content service unavailable" };
  let target: { id: string; ownerId: string; visibility: string; available: boolean } | null = null;
  if (targetType === "PROFILE") {
    const { data } = await db.from("profiles").select("id,account_status,discovery_disabled,profile_visibility").eq("id", targetId).maybeSingle();
    if (data) target = { id: data.id, ownerId: data.id, visibility: data.profile_visibility, available: data.account_status === "ACTIVE" && !data.discovery_disabled };
  } else if (targetType === "MEDIA") {
    const { data } = await db.from("media_objects").select("id,owner_id,visibility,upload_status,processing_status,moderation_status").eq("id", targetId).maybeSingle();
    if (data) target = { id: data.id, ownerId: data.owner_id, visibility: data.visibility, available: data.upload_status === "AVAILABLE" && data.processing_status === "READY" && data.moderation_status === "APPROVED" };
  } else if (targetType === "POST") {
    const { data } = await db.from("content_posts").select("id,author_id,visibility,moderation_status").eq("id", targetId).maybeSingle();
    if (data) target = { id: data.id, ownerId: data.author_id, visibility: data.visibility, available: data.moderation_status === "APPROVED" };
  } else {
    const { data } = await db.from("dating_ads").select("id,author_id,status").eq("id", targetId).maybeSingle();
    if (data) target = { id: data.id, ownerId: data.author_id, visibility: "MEMBERS_ONLY", available: data.status === "active" };
  }
  if (!target) return { allowed: false as const, status: 404, error: "Content not found" };
  const isOwner = target.ownerId === actor.profileId;
  if (!isOwner) {
    const { data: owner } = await db.from("profiles").select("id,account_status,discovery_disabled").eq("id", target.ownerId).maybeSingle();
    if (!owner || owner.account_status !== "ACTIVE" || owner.discovery_disabled) return { allowed: false as const, status: 404, error: "Content not found" };
    const { data: block, error: blockError } = await db.from("user_blocks").select("id").or(`and(blocker_id.eq.${actor.profileId},blocked_profile_id.eq.${target.ownerId}),and(blocker_id.eq.${target.ownerId},blocked_profile_id.eq.${actor.profileId})`).limit(1).maybeSingle();
    if (blockError || block) return { allowed: false as const, status: 404, error: "Content not found" };
  }
  let allowed = isOwner || (target.available && ["PUBLIC", "MEMBERS_ONLY"].includes(target.visibility));
  if (!allowed && target.available && target.visibility === "FOLLOWERS_ONLY") {
    const { data: follow } = await db.from("connections").select("id").eq("follower_id", actor.profileId).eq("followed_id", target.ownerId).eq("connection_type", "follow").maybeSingle();
    allowed = Boolean(follow);
  }
  return allowed ? { allowed: true as const, db, target, isOwner } : { allowed: false as const, status: 404, error: "Content not found" };
}
