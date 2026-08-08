import { NextRequest, NextResponse } from "next/server";
import { getVerifiedIdentity } from "@/lib/auth0/serverSession";
import { managementRequest } from "@/lib/auth0/management";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { getServerSupabase } from "@/lib/supabase/server";
import { appendDurableAudit } from "@/lib/auth/durableAudit";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "no-store, max-age=0, must-revalidate" };

export async function GET(req: NextRequest) {
  const identity = await getVerifiedIdentity(req);
  if (!identity) return NextResponse.json({ verified: false, error: "Authentication required" }, { status: 401, headers: noStore });
  const rate = checkRateLimit(`verification-status:${identity.sub}`, 20, 60);
  if (!rate.allowed) {
    return NextResponse.json({ verified: false, error: "Too many requests" }, { status: 429, headers: { ...noStore, "Retry-After": String(rate.resetInSeconds) } });
  }

  try {
    let verified = identity.emailVerified;
    if (!verified) {
      const response = await managementRequest(`/users/${encodeURIComponent(identity.sub)}?fields=user_id,email,email_verified&include_fields=true`);
      if (!response.ok) throw new Error(`Auth0 user lookup failed (${response.status})`);
      const user: unknown = await response.json();
      const record = typeof user === "object" && user ? user as Record<string, unknown> : {};
      verified = record.email_verified === true;
    }
    if (verified) {
      const db = getServerSupabase();
      if (!db) return NextResponse.json({ verified: false, error: "Profile service unavailable" }, { status: 503, headers: noStore });
      const { data: profile, error: profileError } = await db.from("profiles").update({ verification_status: "EMAIL_VERIFIED", verification_level: "LEVEL_1_EMAIL", updated_at: new Date().toISOString() }).eq("auth_id", identity.sub).in("verification_status", ["UNVERIFIED", "PENDING"]).select("id").maybeSingle();
      if (profileError) return NextResponse.json({ verified: false, error: "Verification state could not be synchronized" }, { status: 502, headers: noStore });
      if (profile) {
        const audited = await appendDurableAudit(db, { actorProfileId: profile.id, actorAuth0Sub: identity.sub, action: "EMAIL_VERIFICATION_SYNCHRONIZED", resourceType: "PROFILE", resourceId: profile.id, outcome: "SUCCESS", metadata: { source: "AUTH0_MANAGEMENT_API" } });
        if (!audited) return NextResponse.json({ verified: false, error: "Verification synchronized but audit recording failed; contact support" }, { status: 503, headers: noStore });
      }
    }
    return NextResponse.json({ verified }, { headers: noStore });
  } catch (error) {
    console.error("Verification status lookup failed", error);
    return NextResponse.json({ verified: false, error: "Verification status unavailable" }, { status: 502, headers: noStore });
  }
}
