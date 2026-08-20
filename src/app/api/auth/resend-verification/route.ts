import { NextRequest, NextResponse } from "next/server";
import { getVerifiedIdentity } from "@/lib/auth0/serverSession";
import { managementRequest } from "@/lib/auth0/management";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { auditLogger } from "@/lib/auth/auditLogger";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store, max-age=0, must-revalidate" };

export async function POST(req: NextRequest) {
  const identity = await getVerifiedIdentity(req);
  if (!identity) return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401, headers: noStore });

  try {
    const userResponse = await managementRequest(`/users/${encodeURIComponent(identity.sub)}?fields=user_id,email_verified&include_fields=true`);
    if (userResponse.ok) {
      const user: unknown = await userResponse.json();
      if (user && typeof user === "object" && (user as Record<string, unknown>).email_verified === true) {
        return NextResponse.json({ success: true, alreadyVerified: true }, { headers: noStore });
      }
    }
  } catch (error) {
    console.error("Current verification status could not be checked before resend", error);
  }

  const rate = checkRateLimit(`verification-resend:${identity.sub}`, 3, 60 * 60);
  if (!rate.allowed) {
    return NextResponse.json({ success: false, error: "Please wait before requesting another email", retryAfter: rate.resetInSeconds }, { status: 429, headers: { ...noStore, "Retry-After": String(rate.resetInSeconds) } });
  }

  try {
    const response = await managementRequest("/jobs/verification-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: identity.sub, client_id: process.env.AUTH0_CLIENT_ID }),
    });
    if (!response.ok) throw new Error(`Verification job failed (${response.status})`);
    auditLogger.logEvent({ actorId: identity.sub, actorRole: "MEMBER", action: "AUTH0_VERIFICATION_EMAIL_RESENT", status: "SUCCESS" });
    return NextResponse.json({ success: true }, { headers: noStore });
  } catch (error) {
    console.error("Verification resend failed", error);
    auditLogger.logEvent({ actorId: identity.sub, actorRole: "MEMBER", action: "AUTH0_VERIFICATION_EMAIL_RESENT", status: "ERROR" });
    return NextResponse.json({ success: false, error: "Verification email could not be sent" }, { status: 502, headers: noStore });
  }
}
