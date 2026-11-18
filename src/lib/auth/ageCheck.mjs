/**
 * FM-06: age check at activation.
 *
 * A member is only let in to the community once an admin has checked a selfie holding a
 * one-time code (for a couple: both partners in one selfie), or an admin has approved them by
 * hand with a written reason. Until then they can set up their own profile and nothing else,
 * and nobody else can see them.
 *
 * profiles.age_verification_status:
 *   AGE_DECLARED    date of birth given at onboarding; may submit an age check
 *   PENDING         selfie submitted, waiting for an admin
 *   AGE_VERIFIED    let in
 *   REVIEW_REQUIRED an admin asked for a new check; may submit again
 *   FAILED          refused; can't resubmit (an admin decides what happens next)
 *   UNVERIFIED      no date of birth: no access at all
 */

export const VERIFIED = "AGE_VERIFIED";
/** Statuses that may use their own profile, settings and the age check, but nothing social. */
export const SETUP_STATUSES = ["AGE_DECLARED", "PENDING", "REVIEW_REQUIRED", VERIFIED];
/** Statuses that may submit a new selfie. */
export const SUBMIT_STATUSES = ["AGE_DECLARED", "REVIEW_REQUIRED"];

// No 0/O, 1/I/L: the code is handwritten and read off a photo.
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 6;
export const CODE_TTL_MS = 24 * 60 * 60 * 1000;
export const CODE_PATTERN = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/;

/** True when the actor is let in to the community: active and age-checked. */
export function hasVerifiedAccess(actor) {
  return actor?.accountStatus === "ACTIVE" && actor?.ageVerificationStatus === VERIFIED;
}

/** True when the actor may set up their own profile and take the age check. */
export function hasSetupAccess(actor) {
  return actor?.accountStatus === "ACTIVE" && SETUP_STATUSES.includes(actor?.ageVerificationStatus);
}

/** True when a profile row may be shown to other members. */
export function isVisibleMember(row) {
  return row?.account_status === "ACTIVE" && row?.age_verification_status === VERIFIED;
}

/** A fresh code from `randomBytes(n)` (node:crypto), unbiased over the alphabet. */
export function newChallengeCode(randomBytes) {
  let code = "";
  // 248 = 8 × 31: bytes at or above it are dropped so every letter is equally likely.
  while (code.length < CODE_LENGTH) {
    for (const byte of randomBytes(16)) {
      if (byte < 248 && code.length < CODE_LENGTH) code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
    }
  }
  return code;
}

/** True when a stored code is still usable at `now`. */
export function challengeIsFresh(code, issuedAt, now = Date.now()) {
  if (!CODE_PATTERN.test(code || "")) return false;
  const issued = Date.parse(issuedAt || "");
  return Number.isFinite(issued) && issued <= now + 60_000 && now - issued < CODE_TTL_MS;
}

/**
 * What an admin's decision on an AGE review does to the profile.
 * VERIFIED lets the member in; FAILED refuses; RETRY_REQUESTED lets them submit a new selfie;
 * REVIEW_REQUIRED (a second opinion) keeps them waiting.
 */
export function profileStatusForDecision(decision) {
  switch (decision) {
    case "VERIFIED": return VERIFIED;
    case "FAILED": return "FAILED";
    case "RETRY_REQUESTED": return "REVIEW_REQUIRED";
    case "REVIEW_REQUIRED": return "PENDING";
    default: return null;
  }
}

/** What the member sees about their own check. */
export function memberAgeCheckState(status) {
  if (status === VERIFIED) return "VERIFIED";
  if (status === "PENDING") return "PENDING";
  if (status === "FAILED") return "FAILED";
  if (status === "REVIEW_REQUIRED") return "RETRY";
  if (status === "AGE_DECLARED") return "REQUIRED";
  return "UNAVAILABLE";
}

/**
 * Pages a member who isn't age-checked yet may open. Everything else shows the age check
 * prompt instead (the server refuses the data either way).
 */
const OPEN_PREFIXES = ["/verify-age", "/me", "/settings", "/onboarding", "/privacy", "/terms", "/legal", "/cookies", "/community-guidelines", "/age-policy", "/content-policy", "/copyright", "/safety", "/about", "/goodbye", "/admin", "/admin-mfa", "/auth", "/login", "/logout", "/verify-email", "/account-restricted"];
export function ageCheckOpenPath(pathname) {
  if (typeof pathname !== "string") return false;
  return OPEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
