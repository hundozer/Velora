// Who may reply to a Tonight plan. One implementation, used by POST /api/messages
// (which enforces it) and GET /api/dating-ads (which shows it), so the indicator a
// member sees can never disagree with what the server allows.

/** Maps a profile to the reply symbol plans use in allowed_reply_genders. */
export function replySymbolFor(gender, isCouple) {
  if (isCouple === true || String(gender || "").toUpperCase().startsWith("COUPLE")) return "👫";
  const value = String(gender || "").toUpperCase();
  if (value.includes("TRANS") || value.includes("NON_BINARY")) return "⚧";
  if (value.includes("FEMALE") || value === "WOMAN") return "♀";
  if (value.includes("MALE") || value === "MAN") return "♂";
  return null;
}

export function ageFromDateOfBirth(value, now = new Date()) {
  if (typeof value !== "string") return null;
  const birth = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(birth.getTime())) return null;
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  if (now.getUTCMonth() < birth.getUTCMonth() || (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate())) age -= 1;
  return age;
}

export function isVerifiedMember(profile) {
  return profile?.verification_status === "VERIFIED" || ["LEVEL_3_PROFILE_BIOMETRIC", "LEVEL_4_CREATOR"].includes(profile?.verification_level || "");
}

const AUDIENCE_WORDS = { "♀": "women", "♂": "men", "👫": "couples", "⚧": "trans and non-binary people" };

/** "women and couples", "everyone" — who the plan is open to, in words. */
export function planAudienceText(plan) {
  const allowed = Array.isArray(plan?.allowed_reply_genders) ? plan.allowed_reply_genders : [];
  const who = allowed.map((s) => AUDIENCE_WORDS[s]).filter(Boolean);
  let text = who.length === 0 ? "everyone" : who.length === 1 ? who[0] : `${who.slice(0, -1).join(", ")} and ${who[who.length - 1]}`;
  if (plan?.require_verified === true) text = who.length === 0 ? "verified members" : `verified ${text}`;
  const min = Number(plan?.min_age ?? 18), max = Number(plan?.max_age ?? 99);
  if (min > 18 || max < 99) text += `, ${min} to ${max}`;
  return text;
}

/**
 * Decides whether `viewer` may reply to `plan`.
 * Returns { canReply, reason } where reason is null or one of
 * NOT_LIVE | OWN_PLAN | PROFILE_TYPE | AGE | VERIFIED | MEDIA.
 * `viewerHasApprovedMedia` is only consulted when the plan requires media.
 */
export function planReplyEligibility({ plan, viewer, viewerHasApprovedMedia = false, now = new Date() }) {
  if (!plan || plan.status !== "active" || plan.moderation_status === "REJECTED" || new Date(plan.expires_at).getTime() <= now.getTime()) return { canReply: false, reason: "NOT_LIVE" };
  if (viewer?.id && plan.author_id === viewer.id) return { canReply: false, reason: "OWN_PLAN" };
  const symbol = replySymbolFor(viewer?.gender, viewer?.is_couple_profile);
  const allowed = Array.isArray(plan.allowed_reply_genders) ? plan.allowed_reply_genders : [];
  if (!symbol || (allowed.length > 0 && !allowed.includes(symbol))) return { canReply: false, reason: "PROFILE_TYPE" };
  const age = ageFromDateOfBirth(viewer?.date_of_birth, now);
  if (age === null || age < Number(plan.min_age) || age > Number(plan.max_age)) return { canReply: false, reason: "AGE" };
  if (plan.require_verified === true && !isVerifiedMember(viewer)) return { canReply: false, reason: "VERIFIED" };
  if (plan.require_media === true && !viewerHasApprovedMedia) return { canReply: false, reason: "MEDIA" };
  return { canReply: true, reason: null };
}

/** The sentence shown under a plan, e.g. "You can reply — open to women and couples." */
export function eligibilityText(plan, result) {
  const audience = planAudienceText(plan);
  if (result.canReply) return `You can reply — open to ${audience}.`;
  switch (result.reason) {
    case "OWN_PLAN": return "Your invitation.";
    case "NOT_LIVE": return "This invitation has ended.";
    case "VERIFIED": return `This invitation is for ${audience}. Verify your photo to reply.`;
    case "MEDIA": return `This invitation is for ${audience} with an approved photo.`;
    default: return `This invitation is for ${audience}.`;
  }
}
