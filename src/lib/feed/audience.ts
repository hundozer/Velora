/**
 * Social V1D: feed audience eligibility. The server applies this after queries,
 * independently of the feed tab: a relationship is not a content-access grant.
 * No preference, photo, or private relationship information is exposed by this helper.
 */
export function canShowFeedAudience(
  visibility: string,
  ownerId: string,
  viewerId: string,
  following: ReadonlySet<string>,
  friends: ReadonlySet<string>,
): boolean {
  // A feed never includes private or unknown visibility, including for its owner.
  if (!["PUBLIC", "MEMBERS_ONLY", "FOLLOWERS_ONLY", "FRIENDS_ONLY"].includes(visibility)) return false;
  // The publisher may see their own published work in Newest, but only once
  // the upstream moderation and publication conditions have passed.
  if (ownerId === viewerId) return true;
  if (visibility === "PUBLIC" || visibility === "MEMBERS_ONLY") return true;
  if (visibility === "FOLLOWERS_ONLY") return following.has(ownerId);
  if (visibility === "FRIENDS_ONLY") return friends.has(ownerId);
  return false; // Defensive default: no implicit audience grant
}
