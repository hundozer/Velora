import { UserAccountModel, MemberProfileModel } from "@/lib/auth/userModel";
import { hasPermission } from "@/lib/auth/permissions";
import { Permission, ContentVisibility } from "@/types/auth";

export interface MediaResource {
  id: string;
  creatorId: string;
  visibility: ContentVisibility;
  price?: number;
}

export interface EntitlementRecord {
  userId: string;
  contentId: string;
  status: "ACTIVE" | "EXPIRED";
}

export class AuthorizationService {
  /**
   * Evaluates if a user account is eligible to perform actions.
   * Returns false if user is suspended, banned, or deleted.
   */
  public static isAccountActive(user: UserAccountModel | null): boolean {
    if (!user) return false;
    return user.status === "ACTIVE" || user.status === "PENDING_VERIFICATION";
  }

  /**
   * 1. Profile Viewing Authorization
   */
  public static canViewProfile(
    currentUser: UserAccountModel | null,
    targetProfile: MemberProfileModel
  ): boolean {
    // Owner can always view own profile
    if (currentUser && currentUser.id === targetProfile.userId) return true;

    // Admin / Moderator override
    if (currentUser && ["SYSTEM_ADMIN", "CONTENT_MODERATOR", "SUPPORT_MODERATOR"].includes(currentUser.role)) {
      return true;
    }

    // Public profiles visible to anyone with profile:view:public permission
    if (targetProfile.publicProfileVisibility) {
      if (!currentUser) return false; // Requires login
      return hasPermission(currentUser.role, "profile:view:public");
    }

    // Private profiles require verified member permission
    if (!currentUser) return false;
    return hasPermission(currentUser.role, "profile:view:private");
  }

  /**
   * 2. Profile Editing Authorization (IDOR Protection)
   */
  public static canEditProfile(
    currentUser: UserAccountModel | null,
    targetProfile: MemberProfileModel
  ): boolean {
    if (!this.isAccountActive(currentUser)) return false;
    if (!currentUser) return false;

    // Strict Ownership Check
    if (currentUser.id === targetProfile.userId) {
      return hasPermission(currentUser.role, "profile:update:self");
    }

    // Admin Override
    return currentUser.role === "SYSTEM_ADMIN";
  }

  /**
   * 3. Direct Messaging Authorization
   */
  public static canSendMessage(
    sender: UserAccountModel | null,
    recipientProfile: MemberProfileModel
  ): boolean {
    if (!this.isAccountActive(sender)) return false;
    if (!sender) return false;

    // Cannot message if blocked by recipient
    if (recipientProfile.blockedUserIds.includes(sender.id)) {
      return false;
    }

    // Check sender permission
    if (!hasPermission(sender.role, "message:send")) return false;

    // Check recipient trust requirement
    if (recipientProfile.requireVerificationToMessage) {
      return sender.verificationStatus === "LEVEL_3_BIOMETRIC" || sender.verificationStatus === "IDENTITY_VERIFIED";
    }

    return true;
  }

  /**
   * 4. Media & Paid Vault Content Viewing Authorization
   */
  public static canViewMedia(
    currentUser: UserAccountModel | null,
    media: MediaResource,
    entitlements: EntitlementRecord[] = []
  ): boolean {
    // PUBLIC media is viewable by authenticated users
    if (media.visibility === "PUBLIC") {
      if (!currentUser) return false;
      return hasPermission(currentUser.role, "media:view:public");
    }

    if (!currentUser) return false;
    if (!this.isAccountActive(currentUser)) return false;

    // Creator / Owner can always view own media
    if (currentUser.id === media.creatorId) return true;

    // Admin Override
    if (["SYSTEM_ADMIN", "CONTENT_MODERATOR"].includes(currentUser.role)) {
      return true;
    }

    // PREMIUM / PAID media requires active entitlement
    if (media.visibility === "PREMIUM" || media.visibility === "SUBSCRIBER_ONLY") {
      const hasEntitlement = entitlements.some(
        (e) => e.userId === currentUser.id && e.contentId === media.id && e.status === "ACTIVE"
      );
      return hasEntitlement && hasPermission(currentUser.role, "media:view:premium");
    }

    // PRIVATE media requires verified permission
    return hasPermission(currentUser.role, "media:view:private");
  }

  /**
   * 5. Creator Content Management Authorization (IDOR Protection)
   */
  public static canManageContent(
    currentUser: UserAccountModel | null,
    media: MediaResource
  ): boolean {
    if (!this.isAccountActive(currentUser)) return false;
    if (!currentUser) return false;

    // Owner check
    if (currentUser.id === media.creatorId) {
      return hasPermission(currentUser.role, "creator:content:manage:self");
    }

    // Content Moderator or Admin Override
    return ["SYSTEM_ADMIN", "CONTENT_MODERATOR"].includes(currentUser.role);
  }

  /**
   * 6. Creator Payout Request Authorization
   */
  public static canRequestPayout(
    currentUser: UserAccountModel | null,
    amount: number,
    currentAvailableBalance: number
  ): boolean {
    if (!this.isAccountActive(currentUser)) return false;
    if (!currentUser) return false;

    // Must be Verified Creator
    if (currentUser.role !== "VERIFIED_CREATOR" && currentUser.role !== "SYSTEM_ADMIN") {
      return false;
    }

    // Must have payout permission
    if (!hasPermission(currentUser.role, "payout:request:self")) return false;

    // Financial check: minimum threshold $100 & sufficient balance
    if (amount < 100) return false;
    if (amount > currentAvailableBalance) return false;

    return true;
  }

  /**
   * 7. Moderation Action Authorization
   */
  public static canModerateContent(
    currentUser: UserAccountModel | null,
    action: "REMOVE_CONTENT" | "SUSPEND_USER" | "APPROVE_PAYOUT"
  ): boolean {
    if (!this.isAccountActive(currentUser)) return false;
    if (!currentUser) return false;

    if (action === "REMOVE_CONTENT") {
      return hasPermission(currentUser.role, "content:remove");
    }

    if (action === "SUSPEND_USER") {
      return hasPermission(currentUser.role, "user:suspend");
    }

    if (action === "APPROVE_PAYOUT") {
      return hasPermission(currentUser.role, "payout:manage");
    }

    return false;
  }
}
