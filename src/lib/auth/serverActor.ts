import { NextRequest } from "next/server";
import { getVerifiedIdentity } from "@/lib/auth0/serverSession";
import { getServerSupabase } from "@/lib/supabase/server";
import { hasValidAdminMfaSession } from "./adminMfaSession";

export const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN", "SYSTEM_ADMIN", "TRUST_AND_SAFETY_ADMIN", "CONTENT_MODERATOR", "PRIVACY_ADMIN", "SUPPORT_ADMIN", "COMMUNITY_ADMIN"]);

export interface ServerActor {
  auth0Sub: string;
  email?: string;
  role: string;
  verificationStatus: string;
  profileId: string;
  adminAuthorized: boolean;
  ageVerificationStatus: string;
  mfaAuthenticated: boolean;
  authenticatedAt?: number;
  emailVerified: boolean;
  accountStatus: string;
}

export type ServerActorResult =
  | { status: "authenticated"; actor: ServerActor }
  | { status: "unauthenticated" }
  | { status: "unprovisioned" }
  | { status: "unavailable" };

export async function resolveServerActor(req?: NextRequest): Promise<ServerActorResult> {
  const identity = await getVerifiedIdentity(req);
  if (!identity) return { status: "unauthenticated" };

  const supabase = getServerSupabase();
  if (!supabase) return { status: "unavailable" };

  const { data, error } = await supabase
    .from("profiles")
    .select("id,auth_id,email,role,verification_status,age_verification_status,account_status")
    .eq("auth_id", identity.sub)
    .maybeSingle();

  if (error) {
    console.error("Server actor lookup failed", { code: error.code });
    return { status: "unavailable" };
  }
  if (!data) return { status: "unprovisioned" };

  // Transitional bootstrap authority: profiles.role is currently browser-writable
  // until the RLS lockdown migration is applied, so it must never grant admin.
  const adminSubjects = new Set(
    (process.env.INTIMO_ADMIN_AUTH0_SUBS || "")
      .split(",")
      .map((subject) => subject.trim())
      .filter(Boolean)
  );
  const configuredRoles = new Map(
    (process.env.INTIMO_ADMIN_ROLE_ASSIGNMENTS || "")
      .split(",")
      .map((entry) => entry.trim().split("="))
      .filter((entry) => entry.length === 2 && ADMIN_ROLES.has(entry[1]))
      .map(([subject, role]) => [subject, role])
  );
  const configuredRole = configuredRoles.get(identity.sub);
  let assignedRole: string | undefined;
  try {
    const { data: assignment } = await supabase.from("admin_assignments").select("role,status").eq("profile_id", data.id).eq("status", "ACTIVE").maybeSingle();
    if (assignment && ADMIN_ROLES.has(assignment.role)) assignedRole = assignment.role;
  } catch {
    // Bootstrap remains environment-authorized until the admin migration exists.
  }
  const adminAuthorized = Boolean(configuredRole || assignedRole) || adminSubjects.has(identity.sub);
  const adminRole = configuredRole || assignedRole || (adminAuthorized ? "SYSTEM_ADMIN" : undefined);

  const internalMfa = adminAuthorized ? await hasValidAdminMfaSession(String(data.id), req) : false;
  return {
    status: "authenticated",
    actor: {
      auth0Sub: identity.sub,
      email: typeof data.email === "string" ? data.email : identity.email,
      role: adminRole || (typeof data.role === "string" && !ADMIN_ROLES.has(data.role) ? data.role : "MEMBER"),
      verificationStatus: typeof data.verification_status === "string" ? data.verification_status : "UNVERIFIED",
      profileId: String(data.id),
      adminAuthorized,
      ageVerificationStatus: typeof data.age_verification_status === "string" ? data.age_verification_status : "UNVERIFIED",
      mfaAuthenticated: identity.mfaAuthenticated || internalMfa,
      authenticatedAt: identity.authenticatedAt,
      emailVerified: identity.emailVerified,
      accountStatus: typeof data.account_status === "string" ? data.account_status : "RESTRICTED",
    },
  };
}

export function hasAdultAccess(actor: ServerActor): boolean {
  return actor.accountStatus === "ACTIVE" && (actor.ageVerificationStatus === "AGE_DECLARED" || actor.ageVerificationStatus === "AGE_VERIFIED");
}

export function isAdminActor(actor: ServerActor): boolean {
  return actor.accountStatus === "ACTIVE" && actor.adminAuthorized;
}
