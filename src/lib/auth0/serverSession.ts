import { NextRequest } from "next/server";
import { auth0 } from "./client";

export interface VerifiedIdentity {
  sub: string;
  email?: string;
  emailVerified: boolean;
  mfaAuthenticated: boolean;
  authenticatedAt?: number;
}

export async function getVerifiedIdentity(req?: NextRequest): Promise<VerifiedIdentity | null> {
  // In the App Router, Auth0 reads the cryptographically protected session from
  // Next's request context. Passing a Vercel alias request to getSession(req)
  // triggers SDK host/domain checks that can reject valid Preview sessions.
  // Keep the parameter for callers that also use it for local authorization,
  // but do not make identity verification depend on the deployment hostname.
  void req;
  const session = await auth0.getSession();
  const user = session?.user;
  if (!user || typeof user.sub !== "string" || user.sub.length === 0) return null;

  return {
    sub: user.sub,
    email: typeof user.email === "string" ? user.email : undefined,
    emailVerified: user.email_verified === true,
    mfaAuthenticated:
      (Array.isArray(user.amr) && user.amr.some((method) => method === "mfa" || method === "otp")) ||
      (typeof user.acr === "string" && user.acr.toLowerCase().includes("mfa")),
    authenticatedAt: typeof user.auth_time === "number" ? user.auth_time : undefined,
  };
}
