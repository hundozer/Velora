// Explainable, privacy-preserving feed ranking. All inputs have already passed
// the canonical feed's age, block, moderation and item visibility gates.
// We NEVER use declared desires, orientation or private profile preferences.
export const EXPLANATIONS = Object.freeze({
  friend: "You're connected",
  follow: "You follow this member",
  room: "A conversation you can join",
  album: "Fresh community album",
  newMember: "New to Intimo",
  recent: "Recently shared",
});

const fresh = (when, now) => {
  const age = Math.max(0, now - new Date(when).getTime());
  if (!Number.isFinite(age)) return 0;
  if (age < 24 * 3600000) return 26;
  if (age < 3 * 86400000) return 20;
  if (age < 7 * 86400000) return 12;
  if (age < 30 * 86400000) return 4;
  return 0;
};

export function explainItem(item, { following = new Set(), friends = new Set() } = {}) {
  if (friends.has(item.actor.id)) return EXPLANATIONS.friend;
  if (following.has(item.actor.id)) return EXPLANATIONS.follow;
  if (item.type === "ROOM") return EXPLANATIONS.room;
  if (item.type === "ALBUM") return EXPLANATIONS.album;
  if (item.type === "PROFILE") return EXPLANATIONS.newMember;
  return EXPLANATIONS.recent;
}

export function rankChemistryFeed(items, context = {}, now = Date.now(), limit = 60) {
  const following = context.following || new Set();
  const friends = context.friends || new Set();
  const seen = new Map();
  const ranked = items.map(item => {
    const relationship = friends.has(item.actor.id) ? 32 : following.has(item.actor.id) ? 20 : 0;
    const category = item.type === "ROOM" ? 24 : item.type === "PROFILE" ? 14 :
      item.type === "ALBUM" ? 15 : item.type === "EVENT" ? 14 : 8;
    return { ...item, why: explainItem(item, { following, friends }),
      score: relationship + category + fresh(item.occurredAt, now) };
  }).sort((a, b) => b.score - a.score || b.occurredAt.localeCompare(a.occurredAt) || a.id.localeCompare(b.id));
  const chosen = [], deferred = [];
  for (const item of ranked) {
    const authorCount = seen.get(item.actor.id) || 0;
    // Diversify what a new member sees; do not let one prolific author
    // dominate the experience when a community is still small.
    if (item.actor.id && authorCount >= 2) { deferred.push(item); continue; }
    chosen.push(item);
    if (item.actor.id) seen.set(item.actor.id, authorCount + 1);
  }
  return chosen.concat(deferred).slice(0, limit).map(({score, ...item}) => item);
}
