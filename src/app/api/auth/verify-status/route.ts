import { NextRequest, NextResponse } from "next/server";
import { getVerifiedIdentity } from "@/lib/auth0/serverSession";
import { managementRequest } from "@/lib/auth0/management";
import { UserSynchronizationService } from "@/lib/auth0/userSync";
import { checkRateLimit } from "@/lib/security/rateLimiter";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store, max-age=0, must-revalidate" };

export async function GET(req: NextRequest) {
  const identity = await getVerifiedIdentity(req);
  if (!identity) return NextResponse.json({ verified: false, error: "Authentication required" }, { status: 401, headers: noStore });
  if (identity.emailVerified) return NextResponse.json({ verified: true }, { headers: noStore });

  const rate = checkRateLimit(`verification-status:${identity.sub}`, 20, 60);
  if (!rate.allowed) {
    return NextResponse.json({ verified: false, error: "Too many requests" }, { status: 429, headers: { ...noStore, "Retry-After": String(rate.resetInSeconds) } });
  }

  try {
    const response = await managementRequest(`/users/${encodeURIComponent(identity.sub)}?fields=user_id,email,email_verified&include_fields=true`);
    if (!response.ok) throw new Error(`Auth0 user lookup failed (${response.status})`);
    const user: unknown = await response.json();
    const record = typeof user === "object" && user ? user as Record<string, unknown> : {};
    const verified = record.email_verified === true;
    if (verified && typeof record.email === "string") {
      UserSynchronizationService.syncAuth0User({ sub: identity.sub, email: record.email, email_verified: true });
    }
    return NextResponse.json({ verified }, { headers: noStore });
  } catch (error) {
    console.error("Verification status lookup failed", error);
    return NextResponse.json({ verified: false, error: "Verification status unavailable" }, { status: 502, headers: noStore });
  }
}
