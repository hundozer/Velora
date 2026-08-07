import { NextRequest, NextResponse } from "next/server";
import { getVerifiedIdentity } from "@/lib/auth0/serverSession";
import { managementRequest } from "@/lib/auth0/management";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { auditLogger } from "@/lib/auth/auditLogger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const identity = await getVerifiedIdentity(req);
  if (!identity) return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
  if (identity.emailVerified) return NextResponse.json({ success: true, alreadyVerified: true });

  const rate = checkRateLimit(`verification-resend:${identity.sub}`, 3, 60 * 60);
  if (!rate.allowed) {
    return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(rate.resetInSeconds) } });
  }

  try {
    const response = await managementRequest("/jobs/verification-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: identity.sub, client_id: process.env.AUTH0_CLIENT_ID }),
    });
    if (!response.ok) throw new Error(`Verification job failed (${response.status})`);
    auditLogger.logEvent({ actorId: identity.sub, actorRole: "MEMBER", action: "AUTH0_VERIFICATION_EMAIL_RESENT", status: "SUCCESS" });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Verification resend failed", error);
    auditLogger.logEvent({ actorId: identity.sub, actorRole: "MEMBER", action: "AUTH0_VERIFICATION_EMAIL_RESENT", status: "ERROR" });
    return NextResponse.json({ success: false, error: "Verification email could not be sent" }, { status: 502 });
  }
}
