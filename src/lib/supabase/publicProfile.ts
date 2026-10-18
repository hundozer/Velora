import { dbRowToProfile, ProfileRow } from "./profileService";
import { PRESENCE_LABELS, presenceBucket } from "@/lib/presence.mjs";
import { trustSignals } from "@/lib/trust.mjs";

export function toMemberVisibleProfile(row: ProfileRow, audience: { friends?: boolean } = {}) {
  const profile = dbRowToProfile(row);
  const sensitiveVisible = row.sensitive_fields_visibility === "EVERYONE"
    || row.sensitive_fields_visibility === "MEMBERS_ONLY"
    || (row.sensitive_fields_visibility === "FRIENDS_ONLY" && audience.friends === true);
  const locationVisible = row.location_precision !== "HIDDEN";
  // Coarse bucket only, and only when the member allows it.
  const presence = presenceBucket(row.last_active_at, row.show_online_status === true);
  return {
    id: profile.id,
    displayName: profile.displayName,
    age: profile.age,
    gender: profile.gender,
    sexualOrientation: sensitiveVisible ? profile.sexualOrientation : undefined,
    country: locationVisible ? profile.country : "",
    city: locationVisible ? profile.city : "",
    location: locationVisible ? [profile.city, profile.country].filter(Boolean).join(", ") : "Hidden",
    languages: profile.languages,
    headline: profile.headline,
    bio: profile.bio,
    interests: sensitiveVisible ? profile.interests : [],
    lifestyleTags: sensitiveVisible ? profile.lifestyleTags : [],
    hobbies: profile.hobbies,
    relationshipStatus: sensitiveVisible ? profile.relationshipStatus : undefined,
    lookingFor: sensitiveVisible ? profile.lookingFor : [],
    isCoupleProfile: profile.isCoupleProfile,
    avatarUrl: profile.avatarUrl,
    coverPhotoUrl: profile.coverPhotoUrl,
    galleryImages: row.photo_visibility_default === "PUBLIC" ? profile.galleryImages : [],
    verified: profile.verified,
    trustSignals: trustSignals({ verificationStatus: row.verification_status, createdAt: row.created_at, hasAvatar: Boolean(row.avatar_url), accountStatus: row.account_status }),
    followersCount: profile.followersCount,
    totalContentCount: profile.totalContentCount,
    showDistance: profile.showDistance && locationVisible,
    presence,
    presenceLabel: presence ? PRESENCE_LABELS[presence] : null,
    recentlyActive: presence === "ONLINE" || presence === "TODAY",
    isOnline: presence === "ONLINE",
    // Compatibility is not backed by a trustworthy signal yet; never synthesise it.
    compatibilityScore: 0,
  };
}
