import { ServerActor } from "./serverActor";

export const ADMIN_ROLES = ["SUPER_ADMIN", "SYSTEM_ADMIN", "TRUST_AND_SAFETY_ADMIN", "CONTENT_MODERATOR", "PRIVACY_ADMIN", "SUPPORT_ADMIN", "COMMUNITY_ADMIN"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];
export type AdminPermission =
  | "dashboard:view" | "users:view_basic" | "users:view_sensitive" | "users:warn" | "users:restrict" | "users:suspend" | "users:ban" | "users:reactivate"
  | "verification:view" | "verification:decide" | "moderation:view" | "moderation:assign" | "moderation:decide" | "moderation:critical"
  | "content:view" | "content:reveal_sensitive" | "content:moderate" | "privacy:view" | "privacy:process"
  | "community:view" | "community:moderate" | "audit:view" | "settings:view" | "settings:manage" | "admin_roles:manage" | "profile:self";

const common: AdminPermission[] = ["dashboard:view", "profile:self"];
export const ADMIN_ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  SUPER_ADMIN: ["dashboard:view", "profile:self", "users:view_basic", "users:view_sensitive", "users:warn", "users:restrict", "users:suspend", "users:ban", "users:reactivate", "verification:view", "verification:decide", "moderation:view", "moderation:assign", "moderation:decide", "moderation:critical", "content:view", "content:reveal_sensitive", "content:moderate", "privacy:view", "privacy:process", "community:view", "community:moderate", "audit:view", "settings:view", "settings:manage", "admin_roles:manage"],
  SYSTEM_ADMIN: [...common, "users:view_basic", "users:view_sensitive", "users:warn", "users:restrict", "users:suspend", "users:ban", "users:reactivate", "verification:view", "moderation:view", "audit:view", "settings:view", "settings:manage", "admin_roles:manage"],
  TRUST_AND_SAFETY_ADMIN: [...common, "users:view_basic", "users:view_sensitive", "users:warn", "users:restrict", "users:suspend", "users:ban", "users:reactivate", "verification:view", "verification:decide", "moderation:view", "moderation:assign", "moderation:decide", "moderation:critical", "content:view", "content:reveal_sensitive", "content:moderate", "audit:view"],
  CONTENT_MODERATOR: [...common, "users:view_basic", "moderation:view", "moderation:assign", "moderation:decide", "content:view", "content:reveal_sensitive", "content:moderate"],
  PRIVACY_ADMIN: [...common, "users:view_basic", "privacy:view", "privacy:process", "audit:view"],
  SUPPORT_ADMIN: [...common, "users:view_basic", "users:warn", "verification:view"],
  COMMUNITY_ADMIN: [...common, "users:view_basic", "moderation:view", "community:view", "community:moderate", "content:view", "content:moderate"],
};

export function isAdminRole(role: string): role is AdminRole { return ADMIN_ROLES.includes(role as AdminRole); }
export function hasAdminPermission(actor: ServerActor, permission: AdminPermission): boolean {
  return actor.adminAuthorized && isAdminRole(actor.role) && ADMIN_ROLE_PERMISSIONS[actor.role].includes(permission);
}
export function adminMfaSatisfied(actor: ServerActor): boolean {
  if (process.env.NODE_ENV !== "production" && process.env.INTIMO_ADMIN_MFA_REQUIRED !== "true") return true;
  return actor.mfaAuthenticated;
}
export function adminSessionFresh(actor: ServerActor, maxAgeSeconds = 30 * 60): boolean {
  return typeof actor.authenticatedAt === "number" && Math.floor(Date.now() / 1000) - actor.authenticatedAt <= maxAgeSeconds;
}
