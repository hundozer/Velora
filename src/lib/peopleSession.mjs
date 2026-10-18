// Keeps a member's place in People while they open a profile and come back.
// Stored in sessionStorage only (this tab, cleared when it closes or on sign-out),
// short-lived, and holds nothing the People page did not already show.

export const PEOPLE_SNAPSHOT_PREFIX = "intimo:people:";
export const PEOPLE_SNAPSHOT_TTL_MS = 15 * 60_000;
const MAX_PEOPLE = 240;

export function snapshotKey(query) {
  return `${PEOPLE_SNAPSHOT_PREFIX}${query || "all"}`;
}

/** Returns the saved snapshot for this filter query, or null when missing, stale or unreadable. */
export function readSnapshot(storage, query, now = Date.now()) {
  try {
    const raw = storage?.getItem(snapshotKey(query));
    if (!raw) return null;
    const snapshot = JSON.parse(raw);
    if (!snapshot || typeof snapshot.savedAt !== "number" || now - snapshot.savedAt > PEOPLE_SNAPSHOT_TTL_MS || !Array.isArray(snapshot.people)) return null;
    return snapshot;
  } catch {
    return null;
  }
}

export function writeSnapshot(storage, query, { people, cursor, rails, scrollY }, now = Date.now()) {
  try {
    const snapshot = { savedAt: now, people: (people || []).slice(0, MAX_PEOPLE), cursor: cursor ?? null, rails: rails ?? null, scrollY: Math.max(0, Math.round(scrollY || 0)) };
    storage?.setItem(snapshotKey(query), JSON.stringify(snapshot));
    return true;
  } catch {
    return false; // Private mode or quota: browsing still works, the place just isn't kept.
  }
}

/** Removes every saved People snapshot (used on sign-out). */
export function clearPeopleSnapshots(storage) {
  try {
    const keys = [];
    for (let i = 0; i < (storage?.length ?? 0); i += 1) {
      const key = storage.key(i);
      if (key && key.startsWith(PEOPLE_SNAPSHOT_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => storage.removeItem(key));
  } catch { /* nothing to clear */ }
}

/** Reads and removes the snapshot, so it restores once (coming back) but not on a later reload. */
export function takeSnapshot(storage, query, now = Date.now()) {
  const snapshot = readSnapshot(storage, query, now);
  try { storage?.removeItem(snapshotKey(query)); } catch { /* ignore */ }
  return snapshot;
}
