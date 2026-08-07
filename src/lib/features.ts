/**
 * Phase 1 product capabilities.
 *
 * Monetization code may remain in the repository for future compatibility, but
 * no route or UI may activate it while this flag is false.
 */
export const MONETIZATION_ENABLED = false as const;

export const MONETIZATION_DISABLED_ROUTES = [
  "/membership",
  "/wallet",
] as const;

// These mock/local-only experiences are withheld until their durable safety and
// ownership boundaries are implemented. Creator profiles themselves remain on.
export const MVP_SAFETY_DISABLED_ROUTES = [
  "/creator-studio",
  "/events",
  "/live",
  "/referrals",
] as const;

export function isMonetizationRoute(pathname: string): boolean {
  return MONETIZATION_DISABLED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function isMvpSafetyDisabledRoute(pathname: string): boolean {
  return MVP_SAFETY_DISABLED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
