/** @typedef {"ANONYMOUS" | "EMAIL_VERIFICATION_REQUIRED" | "ONBOARDING_REQUIRED" | "ACTIVE" | "RESTRICTED" | "ERROR"} AccountState */

/**
 * The single account-state decision table shared by the session API and client.
 * Restricted or unavailable accounts deliberately fail closed.
 *
 * @param {{ authenticated: boolean; available?: boolean; provisioned?: boolean; emailVerified?: boolean; accountStatus?: string }} input
 * @returns {AccountState}
 */
export function deriveAccountState(input) {
  if (input.available === false) return "ERROR";
  if (!input.authenticated) return "ANONYMOUS";
  if (!input.provisioned) {
    return input.emailVerified ? "ONBOARDING_REQUIRED" : "EMAIL_VERIFICATION_REQUIRED";
  }
  return input.accountStatus === "ACTIVE" ? "ACTIVE" : "RESTRICTED";
}

/** @param {unknown} value */
export function safeReturnTo(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return null;
  if (value.includes("\\") || /[\r\n]/.test(value)) return null;
  return value;
}

/**
 * @param {AccountState} state
 * @param {unknown} requestedReturnTo
 */
export function destinationForAccountState(state, requestedReturnTo) {
  if (state === "EMAIL_VERIFICATION_REQUIRED") return "/verify-email";
  if (state === "ONBOARDING_REQUIRED") return "/onboarding";
  if (state === "RESTRICTED") return "/account-restricted";
  if (state === "ACTIVE") return safeReturnTo(requestedReturnTo) || "/dashboard";
  return "/";
}

const MEMBER_ROUTE_PREFIXES = [
  "/dashboard", "/messages", "/settings", "/favorites", "/notifications",
  "/albums/manage", "/dating/create", "/admin", "/admin-mfa",
];

/** @param {string} pathname */
export function isProtectedMemberRoute(pathname) {
  return MEMBER_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
