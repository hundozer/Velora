import { UserRole, Permission } from "@/types/auth";

/**
 * Authoritative 8-Role Permission Map
 * Defines explicit allowed actions for each role in Velora.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  GUEST: [
    "user:view",
    "profile:view:public",
    "media:view:public",
  ],

  MEMBER: [
    "user:view",
    "user:update:self",
    "user:block",
    "profile:create",
    "profile:update:self",
    "profile:view:public",
    "message:send",
    "message:read",
    "message:delete:self",
    "media:upload",
    "media:view:public",
    "media:manage:self",
    "payment:purchase",
    "wallet:view:self",
    "creator:apply",
  ],

  VERIFIED_MEMBER: [
    "user:view",
    "user:update:self",
    "user:block",
    "profile:create",
    "profile:update:self",
    "profile:view:public",
    "profile:view:private",
    "message:send",
    "message:read",
    "message:delete:self",
    "media:upload",
    "media:view:public",
    "media:view:private",
    "media:manage:self",
    "payment:purchase",
    "wallet:view:self",
    "creator:apply",
  ],

  CREATOR: [
    "user:view",
    "user:update:self",
    "user:block",
    "profile:create",
    "profile:update:self",
    "profile:view:public",
    "profile:view:private",
    "message:send",
    "message:read",
    "message:delete:self",
    "media:upload",
    "media:view:public",
    "media:view:private",
    "media:manage:self",
    "payment:purchase",
    "wallet:view:self",
    "creator:content:create",
    "creator:content:manage:self",
    "creator:analytics:view:self",
  ],

  VERIFIED_CREATOR: [
    "user:view",
    "user:update:self",
    "user:block",
    "profile:create",
    "profile:update:self",
    "profile:view:public",
    "profile:view:private",
    "message:send",
    "message:read",
    "message:delete:self",
    "media:upload",
    "media:view:public",
    "media:view:private",
    "media:view:premium",
    "media:manage:self",
    "payment:purchase",
    "wallet:view:self",
    "payout:request:self",
    "creator:content:create",
    "creator:content:manage:self",
    "creator:analytics:view:self",
  ],

  SUPPORT_MODERATOR: [
    "user:view",
    "user:block",
    "profile:view:public",
    "profile:view:private",
    "message:read",
    "report:review",
    "content:remove",
  ],

  CONTENT_MODERATOR: [
    "user:view",
    "user:block",
    "profile:view:public",
    "profile:view:private",
    "media:view:public",
    "media:view:private",
    "media:view:premium",
    "report:review",
    "content:remove",
    "user:suspend",
  ],

  FINANCE_ADMIN: [
    "user:view",
    "wallet:view:self",
    "payout:manage",
    "report:review",
  ],

  SYSTEM_ADMIN: [
    "user:view",
    "user:update:self",
    "user:block",
    "profile:create",
    "profile:update:self",
    "profile:view:public",
    "profile:view:private",
    "message:send",
    "message:read",
    "message:delete:self",
    "media:upload",
    "media:view:public",
    "media:view:private",
    "media:view:premium",
    "media:manage:self",
    "payment:purchase",
    "wallet:view:self",
    "payout:request:self",
    "payout:manage",
    "creator:content:create",
    "creator:content:manage:self",
    "creator:analytics:view:self",
    "report:review",
    "content:remove",
    "user:suspend",
    "admin:system:manage",
  ],
};

/**
 * Checks if a given role possesses a specific granular permission.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}
