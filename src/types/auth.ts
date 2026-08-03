/**
 * Velora Authentication & Authorization System Type Definitions
 * Professional Production-Grade IAM, RBAC/ABAC & Security Schema
 */

export type UserRole =
  | "GUEST"
  | "MEMBER"
  | "VERIFIED_MEMBER"
  | "CREATOR"
  | "VERIFIED_CREATOR"
  | "SUPPORT_MODERATOR"
  | "CONTENT_MODERATOR"
  | "FINANCE_ADMIN"
  | "SYSTEM_ADMIN";

export type AdminRole =
  | "SUPPORT_MODERATOR"
  | "CONTENT_MODERATOR"
  | "FINANCE_ADMIN"
  | "SYSTEM_ADMIN";

export type AccountStatus =
  | "ACTIVE"
  | "PENDING_VERIFICATION"
  | "RESTRICTED"
  | "SUSPENDED"
  | "BANNED"
  | "DELETED";

export type VerificationStatus =
  | "UNVERIFIED"
  | "EMAIL_VERIFIED"
  | "IDENTITY_VERIFIED"
  | "LEVEL_3_BIOMETRIC";

export type CreatorStatus =
  | "NONE"
  | "APPLICANT"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

export type ContentVisibility =
  | "PUBLIC"
  | "PRIVATE"
  | "PREMIUM"
  | "SUBSCRIBER_ONLY"
  | "LIVE_EVENT";

export type Permission =
  // User & Profile Permissions
  | "user:view"
  | "user:update:self"
  | "user:block"
  | "profile:create"
  | "profile:update:self"
  | "profile:view:public"
  | "profile:view:private"
  // Messaging Permissions
  | "message:send"
  | "message:read"
  | "message:delete:self"
  // Media & Vault Permissions
  | "media:upload"
  | "media:view:public"
  | "media:view:private"
  | "media:view:premium"
  | "media:manage:self"
  // Creator Permissions
  | "creator:apply"
  | "creator:content:create"
  | "creator:content:manage:self"
  | "creator:analytics:view:self"
  // Financial & Wallet Permissions
  | "payment:purchase"
  | "wallet:view:self"
  | "payout:request:self"
  // Moderation & Admin Permissions
  | "report:review"
  | "content:remove"
  | "user:suspend"
  | "payout:manage"
  | "admin:system:manage";

export interface SecurityAuditLog {
  id: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  resourceId?: string;
  resourceType?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  status: "SUCCESS" | "DENIED" | "ERROR";
  details?: Record<string, any>;
}

export interface UserAuthSession {
  userId: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  verificationStatus: VerificationStatus;
  creatorStatus: CreatorStatus;
  sessionId: string;
  issuedAt: number;
  expiresAt: number;
}
