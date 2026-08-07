import { AUTH0_CONFIG } from "./config";

function issuer(): string {
  return AUTH0_CONFIG.issuer.replace(/\/$/, "");
}

export async function getManagementToken(): Promise<string> {
  const response = await fetch(`${issuer()}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: AUTH0_CONFIG.clientId,
      client_secret: AUTH0_CONFIG.clientSecret,
      audience: `${issuer()}/api/v2/`,
    }),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Auth0 Management API authentication failed (${response.status})`);
  const body: unknown = await response.json();
  const token = typeof body === "object" && body && "access_token" in body ? body.access_token : null;
  if (typeof token !== "string" || !token) throw new Error("Auth0 Management API returned no access token");
  return token;
}

export async function managementRequest(path: string, init: RequestInit = {}): Promise<Response> {
  if (!path.startsWith("/")) throw new Error("Auth0 Management API path must be relative");
  const token = await getManagementToken();
  return fetch(`${issuer()}/api/v2${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
}
