import { NextRequest, NextResponse } from "next/server";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { currentEmailVerification } from "@/lib/auth0/emailVerification";
import { deriveAccountState } from "@/lib/auth/accountState.mjs";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const result = await resolveServerActor(req);
  if (result.status === "unauthenticated") return NextResponse.json({ authenticated: false, accountState: deriveAccountState({ authenticated: false }) }, { status: 401 });
  if (result.status === "unavailable") return NextResponse.json({ error: "Authorization service unavailable" }, { status: 503 });
  if (result.status === "unprovisioned") {
    const emailVerified = await currentEmailVerification(result.identity);
    return NextResponse.json({
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
    return NextResponse.json({ authenticated: true, provisioned: true, accountState }, { status: 403 });
  }
  return NextResponse.json({
    authenticated: true,
    provisioned: true,
    accountState,
    actor: {
      id: result.actor.auth0Sub,
      email: result.actor.email,
      role: result.actor.role,
      verificationStatus: result.actor.verificationStatus,
      profileId: result.actor.profileId,
      adminAuthorized: result.actor.adminAuthorized,
      emailVerified: result.actor.emailVerified,
    },
  });
}
