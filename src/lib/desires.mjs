// Desire Graph v1 (P1-19). A curated catalogue (no free text at launch) and the
// five states a member can give each desire. Must stay in sync with
// supabase/migrations/20261021_desire_graph.sql (enforced by test).

export const DESIRE_STATES = [
  { value: "LOVE", label: "Love it" },
  { value: "INTO", label: "Into it" },
  { value: "CURIOUS", label: "Curious" },
  { value: "NOT_FOR_ME", label: "Not for me" },
  { value: "HARD_LIMIT", label: "Hard limit" },
];

/** States that count as "wants this" for shared desires and discovery filters. */
export const POSITIVE_STATES = ["LOVE", "INTO", "CURIOUS"];

export const DESIRE_CATEGORIES = [
  { id: "connection", label: "Connection" },
  { id: "play", label: "Play" },
  { id: "group", label: "Couples & groups" },
  { id: "power", label: "Power & kink" },
  { id: "sensation", label: "Sensation" },
  { id: "scene", label: "Scene & social" },
];

export const DESIRES = [
  { id: "dating", category: "connection", label: "Dating" },
  { id: "fwb", category: "connection", label: "Friends with benefits" },
  { id: "casual", category: "connection", label: "Casual encounters" },
  { id: "flirting-chat", category: "connection", label: "Flirting & sexting" },
  { id: "slow-burn", category: "connection", label: "Slow burn" },
  { id: "kissing", category: "play", label: "Making out" },
  { id: "massage", category: "play", label: "Sensual massage" },
  { id: "oral", category: "play", label: "Oral" },
  { id: "toys", category: "play", label: "Toys" },
  { id: "roleplay", category: "play", label: "Roleplay" },
  { id: "photo-play", category: "play", label: "Photo & video play" },
  { id: "threesome", category: "group", label: "Threesomes" },
  { id: "swapping", category: "group", label: "Partner swapping" },
  { id: "soft-swap", category: "group", label: "Soft swap" },
  { id: "group-play", category: "group", label: "Group play" },
  { id: "cuckolding", category: "group", label: "Cuckolding / hotwifing" },
  { id: "unicorn", category: "group", label: "Joining a couple" },
  { id: "voyeurism", category: "group", label: "Watching" },
  { id: "exhibitionism", category: "group", label: "Being watched" },
  { id: "dominance", category: "power", label: "Dominance" },
  { id: "submission", category: "power", label: "Submission" },
  { id: "switch", category: "power", label: "Switching" },
  { id: "bondage", category: "power", label: "Bondage & rope" },
  { id: "praise", category: "power", label: "Praise" },
  { id: "degradation", category: "power", label: "Degradation" },
  { id: "fetish-wear", category: "power", label: "Latex, leather & fetish wear" },
  { id: "feet", category: "power", label: "Feet" },
  { id: "impact", category: "sensation", label: "Spanking & impact" },
  { id: "sensory", category: "sensation", label: "Blindfolds & sensory play" },
  { id: "rough", category: "sensation", label: "Rough play" },
  { id: "tantra", category: "sensation", label: "Tantra & slow sex" },
  { id: "clubs", category: "scene", label: "Swingers clubs" },
  { id: "kink-parties", category: "scene", label: "Kink & fetish parties" },
  { id: "munches", category: "scene", label: "Munches & meetups" },
  { id: "workshops", category: "scene", label: "Workshops" },
  { id: "saunas", category: "scene", label: "Saunas & naturism" },
];

const BY_ID = new Map(DESIRES.map((desire) => [desire.id, desire]));
const STATE_VALUES = new Set(DESIRE_STATES.map((state) => state.value));

export const MAX_DESIRE_FILTERS = 5;

export function desireById(id) {
  return typeof id === "string" ? BY_ID.get(id) ?? null : null;
}

/** "Not for me" is private by default; everything else is visible to members unless the member hides it. */
export function defaultVisibility(state) {
  return state === "NOT_FOR_ME" ? "PRIVATE" : "MEMBERS";
}

/**
 * Normalises a member's submitted selections. Unknown desires, unknown states and
 * duplicates are dropped; visibility falls back to the state default.
 * @param {unknown} input
 * @returns {{ desire_id: string, state: string, visibility: "MEMBERS" | "PRIVATE" }[]}
 */
export function cleanDesireSelections(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Map();
  for (const item of input) {
    if (!item || typeof item !== "object") continue;
    const { desireId, state, visibility } = item;
    if (!desireById(desireId) || !STATE_VALUES.has(state)) continue;
    const resolved = state === "NOT_FOR_ME" ? "PRIVATE" : visibility === "PRIVATE" ? "PRIVATE" : visibility === "MEMBERS" ? "MEMBERS" : defaultVisibility(state);
    seen.set(desireId, { desire_id: desireId, state, visibility: resolved });
  }
  return [...seen.values()];
}

/** Desire filter query param: comma-separated catalogue ids, at most MAX_DESIRE_FILTERS. */
export function parseDesireFilter(value) {
  if (typeof value !== "string" || !value) return [];
  return [...new Set(value.split(",").map((part) => part.trim()).filter((id) => desireById(id)))].slice(0, MAX_DESIRE_FILTERS);
}

/** Ids both members want (any positive state on both sides). */
export function sharedDesireIds(mine, theirs) {
  const positive = new Set(POSITIVE_STATES);
  const wanted = new Set(mine.filter((row) => positive.has(row.state)).map((row) => row.desire_id));
  return theirs.filter((row) => positive.has(row.state) && wanted.has(row.desire_id)).map((row) => row.desire_id);
}
