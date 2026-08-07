import { NextRequest, NextResponse } from "next/server";
import { AdminPermission, adminMfaSatisfied, hasAdminPermission } from "./adminAuthorization";
import { resolveServerActor } from "./serverActor";

export async function requireAdminPermission(req: NextRequest, permission: AdminPermission) {
  const result = await resolveServerActor(req);
  if (result.status !== "authenticated") return { response: NextResponse.json({ error: "Administrator authentication required" }, { status: result.status === "unauthenticated" ? 401 : 503 }) } as const;
  if (!result.actor.adminAuthorized || !hasAdminPermission(result.actor, permission)) return { response: NextResponse.json({ error: "Administrative permission denied" }, { status: 403 }) } as const;
  if (!adminMfaSatisfied(result.actor)) return { response: NextResponse.json({ error: "Administrative MFA required", code: "ADMIN_MFA_REQUIRED" }, { status: 403 }) } as const;
  return { actor: result.actor } as const;
}

export function requestSecurityMetadata(req: NextRequest) {
  return {
    userAgent: req.headers.get("user-agent")?.slice(0, 300) || null,
    forwardedFor: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
  };
}
