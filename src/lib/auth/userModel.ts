import {
  UserRole,
  AccountStatus,
  VerificationStatus,
  CreatorStatus,
  AdminRole,
} from "@/types/auth";
import { TrustLevel } from "./trustLevels";

/**
 * 1. User Account (Core Authentication Identity linked to Auth0)
 * Encapsulates credentials, security status, database fields, and system identity.
 */
export interface UserAccountModel {
  id: string;
  [key: string]: any; // Allow dynamic mock properties (e.g. username, walletBalance, etc.)
  auth0_user_id?: string; // Auth0 Identity Provider Subject ID (e.g. auth0|65a987...)
  authProviderId: string; // Internal Auth Gateway UUID
  email: string;
  email_verified: boolean;
  emailVerified?: boolean; // CamelCase alias for backward compatibility
  phone_number?: string;
  phone?: string; // Alias for backward compatibility
  passwordHash?: string;
  account_status: AccountStatus;
  status: AccountStatus; // Alias for backward compatibility
  verificationStatus: VerificationStatus;
  verificationSubmittedAt?: string;
  verificationPhotoUrl?: string;
  verificationRejectionReason?: string;
  creatorStatus: CreatorStatus;
  role: UserRole;
  twoFactorEnabled: boolean;
  preferred_language: string;
  preferredLanguage?: string; // Alias for backward compatibility
  profile_completed: boolean; // Indicates if user has completed mandatory onboarding
  trustLevel?: TrustLevel;
  verificationLevel?: string; // Added for verification level overrides
  lastLoginIp?: string;
  last_login?: string;
  lastLoginAt?: string;
  created_at: string;
  createdAt?: string; // Alias for backward compatibility
  updatedAt: string;
}

export interface IdentityVerificationRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userAvatarUrl: string;
  verificationPhotoUrl: string;
  submittedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedAt?: string;
  rejectionReason?: string;
}

/**
 * 2. Member Profile (Public / Social Marketplace Profile)
 * Separated from authentication credentials to maintain privacy.
 */
export interface MemberProfileModel {
  id: string;
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string;
  coverPhotoUrl?: string;
  age: number;
  gender: string;
  sexualOrientation: string;
  country: string;
  city: string;
  headline?: string;
  bio: string;
  interests: string[];
  publicProfileVisibility: boolean;
  allowDirectMessages: boolean;
  requireVerificationToMessage: boolean;
  blockedUserIds: string[];
  createdAt: string;
}

/**
 * 3. Creator Profile (Monetization & Content Vault Identity)
 * Required for publishing paid albums, videos, and receiving payouts.
 */
export interface CreatorProfileModel {
  id: string;
  userId: string;
  stageName: string;
  taxForm2257Verified: boolean;
  identityDocHash: string;
  ibanHash?: string;
  payoutAccountStatus: "APPROVED" | "PENDING" | "REJECTED" | "LOCKED";
  availableBalance: number;
  pendingBalance: number;
  earningsHoldUntil?: string;
  monthlySubscriptionPrice?: number;
  totalSubscribersCount: number;
  createdAt: string;
}

/**
 * 4. Admin Identity (Administrative Portal Role)
 * Enforces strict isolation for administrative employees.
 */
export interface AdminIdentityModel {
  id: string;
  userId: string;
  adminRole: AdminRole;
  ipWhitelist: string[];
  hardwareKeyFido2Registered: boolean;
  assignedQueues: string[];
  grantedAt: string;
}

/**
 * Helper to construct a default UserAccount
 */
export function createUserAccount(
  data: Partial<UserAccountModel> & { id: string; email: string }
): UserAccountModel {
  const now = new Date().toISOString();
  const isVerified = data.email_verified ?? data.emailVerified ?? false;
  const statusVal = data.account_status || data.status || "ACTIVE";
  const lang = data.preferred_language || data.preferredLanguage || "en";
  const createdAtVal = data.created_at || data.createdAt || now;

  return {
    id: data.id,
    auth0_user_id: data.auth0_user_id || `auth0|${data.id}`,
    authProviderId: data.authProviderId || `auth-${data.id}`,
    email: data.email.toLowerCase(),
    email_verified: isVerified,
    emailVerified: isVerified,
    phone_number: data.phone_number || data.phone,
    phone: data.phone_number || data.phone,
    role: data.role || "MEMBER",
    account_status: statusVal,
    status: statusVal,
    verificationStatus: data.verificationStatus || (isVerified ? "EMAIL_VERIFIED" : "UNVERIFIED"),
    creatorStatus: data.creatorStatus || "NONE",
    twoFactorEnabled: data.twoFactorEnabled || false,
    preferred_language: lang,
    preferredLanguage: lang,
    profile_completed: data.profile_completed ?? false,
    trustLevel: data.trustLevel || (isVerified ? 2 : 1),
    created_at: createdAtVal,
    createdAt: createdAtVal,
    updatedAt: data.updatedAt || now,
    last_login: data.last_login || data.lastLoginAt || now,
    lastLoginAt: data.last_login || data.lastLoginAt || now,
  };
}
