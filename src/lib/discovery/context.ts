import type { SupabaseClient } from "@supabase/supabase-js";
import { toMemberVisibleProfile } from "@/lib/supabase/publicProfile";
import type { ProfileRow } from "@/lib/supabase/profileService";
import { areaById, distanceBucket, DISTANCE_BUCKET_LABELS } from "@/lib/areas.mjs";

// Shared by GET /api/discovery/profiles and GET /api/discovery/introductions so both
// apply exactly the same safety rules: blocks both ways, FRIENDS_ONLY audiences,
// active accounts only, and coarse location only.

/** Only what the member-visible serializer and the filters need — never email, birth date or explicit fields. */
export const DISCOVERY_COLUMNS = [
  "id", "display_name", "age", "gender", "sexual_orientation", "country", "city", "location", "area_id",
  "languages", "headline", "bio", "interests", "lifestyle_tags", "hobbies", "relationship_status", "looking_for",
  "is_couple_profile", "avatar_url", "cover_photo_url", "gallery_images", "photo_visibility_default",
  "verification_status", "account_status", "followers_count", "total_content_count", "show_distance",
  "location_precision", "sensitive_fields_visibility", "profile_visibility", "show_online_status",
  "last_active_at", "created_at",
].join(",");

export type DiscoveryRow = ProfileRow & { id: string; created_at: string; area_id?: string | null };

export type ViewerContext = { viewerId: string; excludedIds: string[]; friendIds: Set<string>; viewerAreaId: string | null };

export async function loadViewerContext(supabase: SupabaseClient, viewerId: string): Promise<{ context: ViewerContext } | { error: string }> {
  const [{ data: blockRows, error: blockError }, { data: friendshipRows, error: friendshipError }, { data: viewer }] = await Promise.all([
    supabase.from("user_blocks").select("blocker_id,blocked_profile_id").or(`blocker_id.eq.${viewerId},blocked_profile_id.eq.${viewerId}`),
    supabase.from("friendships").select("requester_id,addressee_id").eq("status", "ACCEPTED").or(`requester_id.eq.${viewerId},addressee_id.eq.${viewerId}`),
    supabase.from("profiles").select("area_id").eq("id", viewerId).maybeSingle(),
  ]);
  if (blockError) return { error: "Discovery safety lookup failed" };
  if (friendshipError) return { error: "Discovery friends lookup failed" };
  return {
    context: {
      viewerId,
      excludedIds: (blockRows || []).map((block) => block.blocker_id === viewerId ? block.blocked_profile_id : block.blocker_id),
      friendIds: new Set((friendshipRows || []).map((row) => row.requester_id === viewerId ? row.addressee_id : row.requester_id)),
      viewerAreaId: viewer?.area_id ?? null,
    },
  };
}

/** True when the row may be shown to this viewer (defence in depth after the query filter). */
export function visibleTo(row: DiscoveryRow, context: ViewerContext) {
  return row.profile_visibility !== "FRIENDS_ONLY" || context.friendIds.has(row.id);
}

export function toDiscoveryPerson(row: DiscoveryRow, context: ViewerContext) {
  const bucket = context.viewerAreaId && row.area_id ? distanceBucket(context.viewerAreaId, row.area_id) : null;
  const visible = toMemberVisibleProfile(row, { friends: context.friendIds.has(row.id) });
  return {
    ...visible,
    // Placeholder bios are never presented as the member's own words.
    bio: row.bio || "",
    areaName: row.location_precision === "HIDDEN" ? null : areaById(row.area_id)?.name || null,
    areaLabel: row.location_precision === "HIDDEN" ? null : areaById(row.area_id)?.label || null,
    distance: row.location_precision === "HIDDEN" || !bucket ? null : DISTANCE_BUCKET_LABELS[bucket],
  };
}
