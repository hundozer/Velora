import { isMissingColumnError } from "@/lib/identity.mjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { deleteStoredObject, deleteVariantObjects } from "@/lib/storage/r2";
import { EmailNotificationService } from "@/lib/notifications/emailService";

type Result = { profileId: string; status: "COMPLETED" | "SKIPPED" | "FAILED"; reason?: string };
const DELETE_TABLES: Array<[string, string]> = [
  ["story_views", "viewer_id"], ["member_stories", "owner_id"],
  ["content_reactions", "profile_id"], ["saved_items", "profile_id"], ["content_comments", "author_id"],
  ["content_posts", "author_id"], ["dating_ads", "author_id"], ["personal_ads", "author_id"], ["notifications", "user_id"],
  ["connections", "follower_id"], ["connections", "followed_id"], ["user_blocks", "blocker_id"],
  ["user_blocks", "blocked_profile_id"], ["photo_albums", "owner_id"], ["videos", "owner_id"],
  ["unread_email_outbox", "profile_id"], ["member_desires", "profile_id"], ["member_boundaries", "profile_id"],
  ["profile_views", "viewer_id"], ["profile_views", "viewed_id"], ["interests", "from_id"], ["interests", "to_id"],
  ["album_access_grants", "owner_id"], ["album_access_grants", "viewer_id"],
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

  const { data: media, error: mediaError } = await db.from("media_objects").select("id,object_key,variants").eq("owner_id", profileId);
  if (mediaError) return { profileId, status: "FAILED", reason: "Media inventory failed" };
  try { for (const item of media || []) { await deleteStoredObject(String(item.object_key)); const source = (item.variants as { source?: string } | null)?.source; if (source) await deleteStoredObject(source); await deleteVariantObjects(String(item.id)); } }
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

  // FM-09 identity details, cleared while the profile is still ANONYMIZATION_IN_PROGRESS so a
  // failure stays in the retention queue. Separate so a database without that migration still anonymizes.
  const { error: identityNotesError } = await db.from("profiles").update({ orientation_note: null, gender_note: null, pronouns: null, identity_visibility: {} }).eq("id", profileId);
  if (identityNotesError && !isMissingColumnError(identityNotesError)) { const result: Result = { profileId, status: "FAILED", reason: "Identity details cleanup failed" }; await record(db, runId, result); return result; }
  const completedAt = new Date().toISOString();
  const { error: profileError } = await db.from("profiles").update({
    auth_id: profileId, email: `deleted+${profileId}@invalid.intimo.live`, display_name: "Deleted member", username: null,
    avatar_url: null, cover_photo_url: null, date_of_birth: null, age: null, gender: null, sexual_orientation: null,
    country: "", city: "", location: "", area_id: null, languages: [], headline: null, bio: null, interests: [], lifestyle_tags: [], hobbies: [],
    relationship_status: null, looking_for: [], partner_display_name: null, partner_age: null, partner_gender: null,
    pubic_hair_grooming: null, piercing: null, tattoo: null, erogenous_zones: [], favourite_sex_places: [],
    favourite_sex_positions: [], sex_hobbies: [], categories: [], gallery_images: [], public_profile_visibility: false,
    profile_visibility: "PRIVATE", discovery_disabled: true, show_in_introductions: false, browse_invisibly: true, allow_direct_messages: false, show_online_status: false, show_distance: false,
    account_status: "DEACTIVATED", account_lifecycle_status: "DELETED", deleted_at: completedAt, updated_at: completedAt,
  }).eq("id", profileId).eq("account_lifecycle_status", "ANONYMIZATION_IN_PROGRESS");
  if (profileError) { const result: Result = { profileId, status: "FAILED", reason: "Profile anonymization failed" }; await record(db, runId, result); return result; }
  await db.from("privacy_requests").update({ status: "COMPLETED", completed_at: completedAt, updated_at: completedAt, notes: "Automated erasure/anonymization completed" }).eq("profile_id", profileId).eq("request_type", "DELETION").neq("status", "COMPLETED");
  let notice = "Completion notice sent";
  try { await EmailNotificationService.sendPrivacyDeletionComplete(String(identity.email)); }
  catch { notice = "Completion notice delivery failed; operator follow-up required"; }
  const result: Result = { profileId, status: "COMPLETED", reason: notice }; await record(db, runId, result); return result;
}

/** FM-06: delete age evidence bytes, variants and metadata, leaving the human decision.
 * Idempotent: a partially deleted object is safe to retry. Never touches other media.
 */
export async function eraseAgeReviewSelfie(db: SupabaseClient, reviewId: string): Promise<boolean> {
  const { data: review, error: readError } = await db.from("verification_reviews")
    .select("id,profile_id,verification_type,status,provider_reference,reviewed_at")
    .eq("id", reviewId).maybeSingle();
  if (readError || !review || review.verification_type !== "AGE") return false;
  const due = review.status === "VERIFIED" ||
    (["FAILED", "RETRY_REQUESTED"].includes(review.status) &&
      Boolean(review.reviewed_at) && Date.parse(review.reviewed_at) <= Date.now() - 30 * 86400000);
  if (!due) return false;
  const mediaId = review.provider_reference;
  if (!mediaId) return true;

  // Fail closed on legal holds, including before deleting any R2 bytes.
  const { data: hold, error: holdError } = await db.from("retention_holds")
    .select("id").eq("profile_id", review.profile_id)
    .eq("status", "ACTIVE").limit(1).maybeSingle();
  if (holdError || hold) return false;

  const { data: media, error: mediaError } = await db.from("media_objects")
    .select("id,owner_id,category,visibility,object_key,variants")
    .eq("id", mediaId).maybeSingle();
  if (mediaError) return false;

  if (media) {
    // The review reference is not an authorization to erase arbitrary objects.
    if (media.owner_id !== review.profile_id || media.category !== "AGE_CHECK" ||
        media.visibility !== "PRIVATE" || !media.object_key) return false;
    const keys = new Set<string>([String(media.object_key)]);
    const source = (media.variants as { source?: unknown } | null)?.source;
    if (typeof source === "string" && source) keys.add(source);
    try {
      for (const key of keys) await deleteStoredObject(key);
      await deleteVariantObjects(String(media.id));
    } catch { return false; }

    // Remove media metadata FIRST. If it fails, the review retains the media ID
    // so a second call can retry the deletion. R2 deletions are idempotent.
    const { error: deleteError } = await db.from("media_objects").delete()
      .eq("id", mediaId).eq("owner_id", review.profile_id).eq("category", "AGE_CHECK");
    if (deleteError) return false;
  }

  // Now remove the dangling evidence pointer, retaining the decision and reason.
  // If metadata was already erased during a prior attempt, this step completes the retry.
  const { data: unlinked, error: unlinkError } = await db.from("verification_reviews")
    .update({ provider_reference: null }).eq("id", reviewId)
    .eq("provider_reference", mediaId)
    .eq("verification_type", "AGE").select("id").maybeSingle();
  return !unlinkError && Boolean(unlinked);
}

/** Called by the authenticated scheduled retention job. Returns counts only. */
export async function eraseExpiredAgeReviewSelfies(db: SupabaseClient): Promise<{ scanned: number; deleted: number; failed: number }> {
  const cutoff = new Date(Date.now() - 30 * 86400000).toISOString();
  const [approved, refused] = await Promise.all([
    // Backstop for interrupted or hand-approved reviews: approved evidence must not linger.
    db.from("verification_reviews").select("id").eq("verification_type", "AGE")
      .eq("status", "VERIFIED").not("provider_reference", "is", null)
      .order("reviewed_at", { ascending: true }).limit(100),
    db.from("verification_reviews").select("id").eq("verification_type", "AGE")
      .in("status", ["FAILED", "RETRY_REQUESTED"])
      .not("provider_reference", "is", null).lte("reviewed_at", cutoff)
      .order("reviewed_at", { ascending: true }).limit(100),
  ]);
  if (approved.error || refused.error) throw new Error("Age selfie retention inventory unavailable");
  const ids = [...new Set([...(approved.data ?? []), ...(refused.data ?? [])].map(row => String(row.id)))];
  let deleted = 0;
  for (const id of ids) if (await eraseAgeReviewSelfie(db, id)) deleted++;
  return { scanned: ids.length, deleted, failed: ids.length - deleted };
}
