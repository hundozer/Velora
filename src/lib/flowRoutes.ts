// Focused, single-task screens (sign-up, sign-in, onboarding) render without
// the site header, bottom navigation or footer.
const FLOW_PREFIXES = ["/register", "/login", "/onboarding", "/reset-password", "/update-password", "/verify-email", "/admin", "/admin-mfa"];

export function isFlowPath(pathname: string | null): boolean {
  return Boolean(pathname) && FLOW_PREFIXES.some((prefix) => pathname === prefix || pathname!.startsWith(`${prefix}/`));
}
