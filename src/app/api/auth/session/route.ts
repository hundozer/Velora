import { NextRequest, NextResponse } from "next/server";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { deriveAccountState } from "@/lib/auth/accountState.mjs";

export const dynamic = "force-dynamic";
const privateHeaders = { "Cache-Control": "private, no-store" };
function json(body: unknown, init: ResponseInit = {}) {
  return NextResponse.json(body, { ...init, headers: { ...init.headers, ...privateHeaders } });
}

export async function GET(req: NextRequest) {
  // Reuse the already verified owner's row rather than a second browser request
  // that repeats identity and profile lookups before the home feed can start.
  const result = await resolveServerActor(req, { includeProfile: true });
  if (result.status === "unauthenticated") return json({ authenticated: false, accountState: deriveAccountState({ authenticated: false }) }, { status: 401 });
  if (result.status === "unavailable") return json({ error: "Authorization service unavailable" }, { status: 503 });
  if (result.status === "unprovisioned") {
    const emailVerified = result.identity.emailVerified;
    return json({
      authenticated: true,
      provisioned: false,
      accountState: deriveAccountState({ authenticated: true, provisioned: false, emailVerified }),
      identity: {
        id: result.identity.sub,
        email: result.identity.email,
        emailVerified,
      },
    });
  }
  const accountState = deriveAccountState({ authenticated: true, provisioned: true, accountStatus: result.actor.accountStatus });
  if (accountState === "RESTRICTED") {
    return json({ authenticated: true, provisioned: true, accountState }, { status: 403 });
  }
  return json({
    authenticated: true,
    provisioned: true,
    accountState,
    profile: result.profile,
    actor: {
      id: result.actor.userId,
      email: result.actor.email,
      role: result.actor.role,
      verificationStatus: result.actor.verificationStatus,
      profileId: result.actor.profileId,
      adminAuthorized: result.actor.adminAuthorized,
      emailVerified: result.actor.emailVerified,
    },
  }, { headers: privateHeaders });
}
