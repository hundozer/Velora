// Boundaries & approach preferences (P1-20). A small fixed set of kinds, each
// with Comfortable / Ask me first / Not interested. Enforced on the server,
// not just displayed. Must stay in sync with
// supabase/migrations/20261022_member_boundaries.sql (enforced by test).

export const BOUNDARY_PREFERENCES = [
  { value: "COMFORTABLE", label: "Comfortable" },
  { value: "ASK_FIRST", label: "Ask me first" },
  { value: "NOT_INTERESTED", label: "Not interested" },
];

export const BOUNDARY_GROUPS = [
  { id: "first-message", label: "First messages from…", hint: "Once you've written to someone, they can always reply." },
  { id: "media", label: "Photos & access" },
  { id: "interaction", label: "Meeting & chat" },
];

/**
 * enforce:
 * - "FIRST_MESSAGE": Not interested blocks a first message; Ask me first is shown to the sender.
 * - "ESTABLISHED": Not interested blocks always; Ask me first allows only once the member has written back.
 * - "DISPLAY": shown on the profile only.
 */
export const BOUNDARY_KINDS = [
  { id: "FIRST_MESSAGE_MEN", group: "first-message", label: "Men", enforce: "FIRST_MESSAGE", default: "COMFORTABLE" },
  { id: "FIRST_MESSAGE_WOMEN", group: "first-message", label: "Women", enforce: "FIRST_MESSAGE", default: "COMFORTABLE" },
  { id: "FIRST_MESSAGE_COUPLES", group: "first-message", label: "Couples", enforce: "FIRST_MESSAGE", default: "COMFORTABLE" },
  { id: "FIRST_MESSAGE_OTHER", group: "first-message", label: "Non-binary, trans & other identities", enforce: "FIRST_MESSAGE", default: "COMFORTABLE" },
  { id: "FIRST_MESSAGE_UNVERIFIED", group: "first-message", label: "Unverified members", enforce: "FIRST_MESSAGE", default: "COMFORTABLE" },
  { id: "EXPLICIT_MEDIA_IN_CHAT", group: "media", label: "Explicit photos in chat", enforce: "ESTABLISHED", default: "ASK_FIRST" },
  { id: "PRIVATE_ALBUM_REQUESTS", group: "media", label: "Requests for my private photos", enforce: "ESTABLISHED", default: "COMFORTABLE" },
  { id: "MEET_SAME_DAY", group: "interaction", label: "Meeting the same day", enforce: "DISPLAY", default: "ASK_FIRST" },
  { id: "EXPLICIT_CHAT", group: "interaction", label: "Explicit chat early on", enforce: "DISPLAY", default: "ASK_FIRST" },
];

const KINDS = new Map(BOUNDARY_KINDS.map((kind) => [kind.id, kind]));
const PREFERENCES = new Set(BOUNDARY_PREFERENCES.map((item) => item.value));

export function boundaryKind(id) {
  return typeof id === "string" ? KINDS.get(id) ?? null : null;
}

/** Normalises submitted preferences: unknown kinds or preferences are dropped, last one wins. */
export function cleanBoundaries(input) {
  if (!Array.isArray(input)) return [];
  const rows = new Map();
  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const kind = boundaryKind(item.kind);
    if (!kind || !PREFERENCES.has(item.preference)) continue;
    rows.set(kind.id, { kind: kind.id, preference: item.preference });
  }
  return [...rows.values()];
}

/** Full preference map with defaults applied. @param {{kind: string, preference: string}[]} rows */
export function resolveBoundaries(rows) {
  const resolved = Object.fromEntries(BOUNDARY_KINDS.map((kind) => [kind.id, kind.default]));
  for (const row of rows || []) if (KINDS.has(row.kind) && PREFERENCES.has(row.preference)) resolved[row.kind] = row.preference;
  return resolved;
}

/** Which first-message boundary applies to a sender's profile gender. */
export function senderCategory(gender, isCoupleProfile) {
  if (isCoupleProfile || (typeof gender === "string" && gender.startsWith("COUPLE_"))) return "FIRST_MESSAGE_COUPLES";
  if (gender === "MALE") return "FIRST_MESSAGE_MEN";
  if (gender === "FEMALE") return "FIRST_MESSAGE_WOMEN";
  return "FIRST_MESSAGE_OTHER";
}

/**
 * Decides whether a first message (the recipient has not written to the sender yet) may be sent.
 * @returns {{ allowed: true } | { allowed: false, reason: string }}
 */
export function firstMessageDecision(boundaries, sender) {
  const category = senderCategory(sender.gender, sender.isCoupleProfile);
  if (boundaries[category] === "NOT_INTERESTED") {
    return { allowed: false, reason: `This member isn't accepting first messages from ${boundaryKind(category).label.toLowerCase()}.` };
  }
  if (!sender.verified && boundaries.FIRST_MESSAGE_UNVERIFIED === "NOT_INTERESTED") {
    return { allowed: false, reason: "This member only accepts first messages from verified members." };
  }
  return { allowed: true };
}

/**
 * For ESTABLISHED kinds (explicit photos in chat, private photo requests).
 * @param {string} preference @param {boolean} established recipient has written to the requester
 */
export function establishedDecision(preference, established) {
  if (preference === "NOT_INTERESTED") return false;
  if (preference === "ASK_FIRST") return established;
  return true;
}
