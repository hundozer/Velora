export const OFFICIAL_INTIMO_AUTH0_ISSUER = "https://intimo.eu.auth0.com";

function normalizedUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function validateProductionAuthConfiguration(env) {
  const required = ["AUTH0_SECRET", "AUTH0_CLIENT_ID", "AUTH0_CLIENT_SECRET", "AUTH0_ISSUER_BASE_URL"];
  const missing = required.filter((name) => !env[name]);
  const configuredIssuer = normalizedUrl(env.AUTH0_ISSUER_BASE_URL);
  return {
    valid: missing.length === 0 && configuredIssuer === OFFICIAL_INTIMO_AUTH0_ISSUER,
    missing,
    issuerValid: configuredIssuer === OFFICIAL_INTIMO_AUTH0_ISSUER,
  };
}
