// Web push policy (Phase 2). Pure helpers shared by the API, the sender and tests.
// Notifications are discreet: they can show on a lock screen, so they never
// carry names, photos, message text or desires. Same rule as return emails.

export const PUSH_CATEGORIES = ["MESSAGE", "INTEREST", "PRIVATE_ACCESS", "PLAN_REPLY"];

/** English is the key; the Czech lives in src/locales/cs/phrases.json. */
export const PUSH_COPY = {
  MESSAGE: { body: "Someone wrote to you.", path: "/messages" },
  INTEREST: { body: "You have a new mutual connection.", path: "/activity" },
  PRIVATE_ACCESS: { body: "There's an update about private photos.", path: "/notifications" },
  PLAN_REPLY: { body: "Your plan got a reply.", path: "/messages" },
};

// Only real browser push services, so a member can't make the server POST to
// an arbitrary URL (SSRF). Chrome/Edge/Android, Firefox, Safari/iOS, Windows.
const EXACT_HOSTS = new Set(["fcm.googleapis.com", "android.googleapis.com", "updates.push.services.mozilla.com", "web.push.apple.com"]);
const HOST_SUFFIXES = [".push.apple.com", ".notify.windows.com"];

/** @param {unknown} endpoint */
export function isAllowedPushEndpoint(endpoint) {
  if (typeof endpoint !== "string" || endpoint.length > 1000) return false;
  let url;
  try { url = new URL(endpoint); } catch { return false; }
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) return false;
  const host = url.hostname.toLowerCase();
  return EXACT_HOSTS.has(host) || HOST_SUFFIXES.some((suffix) => host.endsWith(suffix) && host.length > suffix.length);
}

const BASE64URL = /^[A-Za-z0-9_-]+={0,2}$/;

/**
 * Validates a PushSubscription.toJSON() body.
 * @param {unknown} value
 * @returns {{ endpoint: string, p256dh: string, auth: string } | null}
 */
export function parsePushSubscription(value) {
  if (!value || typeof value !== "object") return null;
  const { endpoint, keys } = /** @type {{ endpoint?: unknown, keys?: { p256dh?: unknown, auth?: unknown } }} */ (value);
  if (!isAllowedPushEndpoint(endpoint) || !keys || typeof keys !== "object") return null;
  const { p256dh, auth } = keys;
  if (typeof p256dh !== "string" || p256dh.length < 40 || p256dh.length > 200 || !BASE64URL.test(p256dh)) return null;
  if (typeof auth !== "string" || auth.length < 8 || auth.length > 100 || !BASE64URL.test(auth)) return null;
  return { endpoint: /** @type {string} */ (endpoint), p256dh, auth };
}

/** @param {string[] | null | undefined} optOut @param {string} category */
export function pushAllowed(optOut, category) {
  const list = optOut || [];
  return PUSH_CATEGORIES.includes(category) && !list.includes("ALL") && !list.includes(category);
}

/**
 * The payload the service worker shows. Title is always just "Intimo".
 * @param {string} category
 * @param {(text: string) => string} [translate]
 */
export function pushPayload(category, translate = (text) => text) {
  const copy = PUSH_COPY[/** @type {keyof typeof PUSH_COPY} */ (category)];
  if (!copy) return null;
  return { title: "Intimo", body: translate(copy.body), url: copy.path, tag: `intimo-${category.toLowerCase()}` };
}
