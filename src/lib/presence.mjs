// Presence (P1-04): coarse, privacy-aware activity buckets. Never exact times.

export const ACTIVITY_TOUCH_INTERVAL_MS = 5 * 60 * 1000;
const ONLINE_MS = 10 * 60 * 1000;
const TODAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * TODAY_MS;

export const PRESENCE_LABELS = { ONLINE: "Online now", TODAY: "Active today", WEEK: "Active this week" };

/**
 * @param {string | null | undefined} lastActiveAt
 * @param {boolean} showOnlineStatus member's own visibility choice
 * @returns {"ONLINE" | "TODAY" | "WEEK" | null} null when hidden or older than a week
 */
export function presenceBucket(lastActiveAt, showOnlineStatus, now = new Date()) {
  if (!showOnlineStatus || !lastActiveAt) return null;
  const age = now.getTime() - new Date(lastActiveAt).getTime();
  if (Number.isNaN(age) || age < -60_000) return null;
  if (age <= ONLINE_MS) return "ONLINE";
  if (age <= TODAY_MS) return "TODAY";
  if (age <= WEEK_MS) return "WEEK";
  return null;
}

/** True when last_active_at is missing or older than the touch interval. */
export function shouldTouchActivity(lastActiveAt, now = new Date()) {
  if (!lastActiveAt) return true;
  const last = new Date(lastActiveAt).getTime();
  return Number.isNaN(last) || now.getTime() - last >= ACTIVITY_TOUCH_INTERVAL_MS;
}
