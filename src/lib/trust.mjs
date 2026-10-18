// Trust signals v1 (P1-22): a few plain facts, never a score or ranking.
// Each signal states something checkable; absence of a badge means nothing bad.

export const ESTABLISHED_MIN_DAYS = 30;

export const TRUST_SIGNALS = {
  PHOTO_VERIFIED: { label: "Photo verified", description: "A moderator reviewed and approved this member's photo verification." },
  ESTABLISHED: { label: "Established", description: `Member for over ${ESTABLISHED_MIN_DAYS} days with a profile photo and no active restrictions.` },
};

/** @returns {Array<keyof typeof TRUST_SIGNALS>} */
export function trustSignals({ verificationStatus, createdAt, hasAvatar, accountStatus }, now = new Date()) {
  const signals = [];
  if (verificationStatus === "VERIFIED") signals.push("PHOTO_VERIFIED");
  const created = createdAt ? new Date(createdAt).getTime() : NaN;
  const ageDays = (now.getTime() - created) / 86_400_000;
  if (Number.isFinite(ageDays) && ageDays >= ESTABLISHED_MIN_DAYS && hasAvatar && (accountStatus ?? "ACTIVE") === "ACTIVE") signals.push("ESTABLISHED");
  return signals;
}
