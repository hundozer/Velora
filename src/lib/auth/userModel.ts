import {
  UserRole,
  AccountStatus,
  VerificationStatus,
  CreatorStatus,
  AdminRole,
} from "@/types/auth";

/**
 * 1. User Account (Core Authentication Identity)
 * Encapsulates credentials, security status, and base system identity.
 */
export interface UserAccountModel {
  id: string;

  authProviderId: string; // Internal Auth Gateway UUID or Federated Provider Subject ID
  email: string;
  phone?: string;
  passwordHash?: string;
  role: UserRole;
  status: AccountStatus;
  verificationStatus: VerificationStatus;
  creatorStatus: CreatorStatus;
  twoFactorEnabled: boolean;
  preferredLanguage: string;
  lastLoginIp?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
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
  return {
    id: data.id,

    authProviderId: data.authProviderId || `auth-${data.id}`,
    email: data.email,
    phone: data.phone,
    role: data.role || "MEMBER",
    status: data.status || "ACTIVE",
    verificationStatus: data.verificationStatus || "UNVERIFIED",
    creatorStatus: data.creatorStatus || "NONE",
    twoFactorEnabled: data.twoFactorEnabled || false,
    preferredLanguage: data.preferredLanguage || "en",
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}
