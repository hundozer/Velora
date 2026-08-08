import type { SupabaseClient } from "@supabase/supabase-js";
import { deleteStoredObject } from "@/lib/storage/r2";
import { EmailNotificationService } from "@/lib/notifications/emailService";

type Result = { profileId: string; status: "COMPLETED" | "SKIPPED" | "FAILED"; reason?: string };
const DELETE_TABLES: Array<[string, string]> = [
  ["content_reactions", "profile_id"], ["saved_items", "profile_id"], ["content_comments", "author_id"],
  ["content_posts", "author_id"], ["dating_ads", "author_id"], ["notifications", "user_id"],
  ["connections", "follower_id"], ["connections", "followed_id"], ["user_blocks", "blocker_id"],
  ["user_blocks", "blocked_profile_id"], ["photo_albums", "owner_id"], ["videos", "owner_id"],
];

async function record(db: SupabaseClient, runId: string, result: Result) {
  await db.from("retention_execution_events").insert({ run_id: runId, profile_id: result.profileId, outcome: result.status, detail: result.reason || null });
}

export async function anonymizeDeletedProfile(db: SupabaseClient, runId: string, profileId: string): Promise<Result> {
  const { data: identity, error: identityError } = await db.from("profiles").select("email").eq("id", profileId).maybeSingle();
  if (identityError || !identity?.email) return { profileId, status: "FAILED", reason: "Profile identity lookup failed" };
  const { data: hold, error: holdError } = await db.from("retention_holds").select("id").eq("profile_id", profileId).eq("status", "ACTIVE").limit(1).maybeSingle();
  if (holdError) return { profileId, status: "FAILED", reason: "Legal-hold lookup failed" };
  if (hold) { const result: Result = { profileId, status: "SKIPPED", reason: "Active legal hold" }; await record(db, runId, result); return result; }

  const { data: media, error: mediaError } = await db.from("media_objects").select("id,object_key").eq("owner_id", profileId);
  if (mediaError) return { profileId, status: "FAILED", reason: "Media inventory failed" };
  try { for (const item of media || []) await deleteStoredObject(String(item.object_key)); }
  catch { const result: Result = { profileId, status: "FAILED", reason: "Object-store deletion failed" }; await record(db, runId, result); return result; }

  const startedAt = new Date().toISOString();
  const { error: startError } = await db.from("profiles").update({ account_lifecycle_status: "ANONYMIZATION_IN_PROGRESS", anonymization_started_at: startedAt, updated_at: startedAt }).eq("id", profileId).eq("account_lifecycle_status", "DEACTIVATED");
  if (startError) { const result: Result = { profileId, status: "FAILED", reason: "Lifecycle transition failed" }; await record(db, runId, result); return result; }
  for (const [table, column] of DELETE_TABLES) {
    const { error } = await db.from(table).delete().eq(column, profileId);
    if (error) { const result: Result = { profileId, status: "FAILED", reason: `Dependent cleanup failed: ${table}` }; await record(db, runId, result); return result; }
  }
  const { error: mediaDeleteError } = await db.from("media_objects").delete().eq("owner_id", profileId);
  if (mediaDeleteError) { const result: Result = { profileId, status: "FAILED", reason: "Media metadata cleanup failed" }; await record(db, runId, result); return result; }

  const { error: senderError } = await db.from("direct_messages").update({ sender_id: null, sender_name: "Deleted member", sender_avatar: null }).eq("sender_id", profileId);
  const { error: receiverError } = await db.from("direct_messages").update({ receiver_id: null }).eq("receiver_id", profileId);
  if (senderError || receiverError) { const result: Result = { profileId, status: "FAILED", reason: "Message anonymization failed" }; await record(db, runId, result); return result; }

  const completedAt = new Date().toISOString();
  const { error: profileError } = await db.from("profiles").update({
    auth_id: `deleted|${profileId}`, email: `deleted+${profileId}@invalid.intimo.live`, display_name: "Deleted member", username: null,
    avatar_url: null, cover_photo_url: null, date_of_birth: null, age: null, gender: null, sexual_orientation: null,
    country: "", city: "", location: "", languages: [], headline: null, bio: null, interests: [], lifestyle_tags: [], hobbies: [],
    relationship_status: null, looking_for: [], partner_display_name: null, partner_age: null, partner_gender: null,
    pubic_hair_grooming: null, piercing: null, tattoo: null, erogenous_zones: [], favourite_sex_places: [],
    favourite_sex_positions: [], sex_hobbies: [], categories: [], gallery_images: [], public_profile_visibility: false,
    profile_visibility: "PRIVATE", allow_direct_messages: false, show_online_status: false, show_distance: false,
    account_status: "DEACTIVATED", account_lifecycle_status: "DELETED", deleted_at: completedAt, updated_at: completedAt,
  }).eq("id", profileId).eq("account_lifecycle_status", "ANONYMIZATION_IN_PROGRESS");
  if (profileError) { const result: Result = { profileId, status: "FAILED", reason: "Profile anonymization failed" }; await record(db, runId, result); return result; }
  await db.from("privacy_requests").update({ status: "COMPLETED", completed_at: completedAt, updated_at: completedAt, notes: "Automated erasure/anonymization completed" }).eq("profile_id", profileId).eq("request_type", "DELETION").neq("status", "COMPLETED");
  let notice = "Completion notice sent";
  try { await EmailNotificationService.sendPrivacyDeletionComplete(String(identity.email)); }
  catch { notice = "Completion notice delivery failed; operator follow-up required"; }
  const result: Result = { profileId, status: "COMPLETED", reason: notice }; await record(db, runId, result); return result;
}
