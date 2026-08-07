import { dbRowToProfile, ProfileRow } from "./profileService";

export function toMemberVisibleProfile(row: ProfileRow) {
  const profile = dbRowToProfile(row);
  const sensitiveVisible = row.sensitive_fields_visibility === "EVERYONE" || row.sensitive_fields_visibility === "MEMBERS_ONLY";
  const locationVisible = row.location_precision !== "HIDDEN";
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
    followersCount: profile.followersCount,
    totalContentCount: profile.totalContentCount,
    showDistance: profile.showDistance && locationVisible,
    // Presence, compatibility, and distance are not yet backed by trustworthy
    // durable signals. Do not synthesize them at the API boundary.
    isOnline: false,
    compatibilityScore: 0,
  };
}
