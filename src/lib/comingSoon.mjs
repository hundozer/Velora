/**
 * Coming Soon: while true, visitors who are not signed in see only the front page
 * (invitation request form), sign-in / invitation flows and the legal pages.
 * Signed-in members are unaffected. Set to false to reopen the public site.
 */
export const COMING_SOON = true;

// Pages a signed-out visitor may still open. Everything else redirects to "/".
const OPEN_PREFIXES = [
  // Sign-in, invitation and account flows.
  "/login", "/auth", "/register", "/verify-email", "/reset-password", "/update-password", "/goodbye", "/account-restricted",
  // Legal pages must stay reachable.
  "/legal", "/privacy", "/terms", "/cookies", "/age-policy", "/community-guidelines", "/content-policy", "/copyright",
  // App shell and static files.
  "/_next", "/manifest.webmanifest", "/sw.js", "/offline.html", "/brand", "/icons", "/images", "/.well-known",
];

/** True when a signed-out visitor may open this path while Coming Soon is on. */
export function isOpenWhileComingSoon(pathname) {
  if (pathname === "/") return true;
  if (pathname === "/api/public" || pathname.startsWith("/api/public/")) return false;
  if (pathname.startsWith("/api/")) return true; // Every other API checks its own access.
  return OPEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
