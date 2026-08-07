import { NextRequest, NextResponse } from "next/server";
import { resolveServerActor } from "@/lib/auth/serverActor";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const result = await resolveServerActor(req);
  if (result.status === "unauthenticated") return NextResponse.json({ authenticated: false }, { status: 401 });
  if (result.status === "unavailable") return NextResponse.json({ error: "Authorization service unavailable" }, { status: 503 });
  if (result.status === "unprovisioned") return NextResponse.json({ authenticated: true, provisioned: false });
  return NextResponse.json({
    authenticated: true,
    provisioned: true,
    actor: {
      id: result.actor.auth0Sub,
      email: result.actor.email,
      role: result.actor.role,
      verificationStatus: result.actor.verificationStatus,
      profileId: result.actor.profileId,
      adminAuthorized: result.actor.adminAuthorized,
    },
  });
}
