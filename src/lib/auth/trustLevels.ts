import { UserAccountModel } from "@/lib/auth/userModel";

export type TrustLevel = 1 | 2 | 3 | 4;

export interface TrustLevelDetails {
  level: TrustLevel;
  title: string;
  description: string;
  requirements: string[];
  capabilities: string[];
}

export const TRUST_LEVEL_DEFINITIONS: Record<TrustLevel, TrustLevelDetails> = {
  1: {
    level: 1,
    title: "New Member",
    description: "Registered account on Intimo",
    requirements: ["Account created"],
    capabilities: ["Browse public directory", "View public creator profiles", "View public media"],
  },
  2: {
    level: 2,
    title: "Verified Member",
    description: "Email address verified",
    requirements: ["Email verification confirmed"],
    capabilities: [
      "Send direct messages",
      "Join public communities",
      "Save and comment on approved content",
      "Follow visible members",
    ],
  },
  3: {
    level: 3,
    title: "Identity Verified Member",
    description: "Manual photo verification completed",
    requirements: ["Selfie with Intimo, username and current date"],
    capabilities: [
      "Access verified-only private spaces",
      "Join restricted communities",
      "Create creator application",
    ],
  },
  4: {
    level: 4,
    title: "Verified Creator",
    description: "Identity-verified creator profile approved for the free MVP",
    requirements: [
      "Level 3 Identity verification",
      "Creator profile review",
      "Participant and publication consent controls",
    ],
    capabilities: [
      "Publish free approved media",
      "Maintain a visible creator profile",
      "Use standard community interactions",
    ],
  },
};

export class TrustLevelEngine {
  /**
   * Evaluates the current trust level of a user based on account attributes
   */
  public static evaluateTrustLevel(user: UserAccountModel): TrustLevel {
    // Level 4 Check: Approved creator with verified identity
    if (
      user.role === "VERIFIED_CREATOR" &&
      user.creatorStatus === "APPROVED" &&
      (user.verificationStatus === "LEVEL_3_BIOMETRIC" || user.verificationStatus === "IDENTITY_VERIFIED")
    ) {
      return 4;
    }

    // Level 3 Check: Biometric / Identity Verified
    if (
      user.verificationStatus === "LEVEL_3_BIOMETRIC" ||
      user.verificationStatus === "IDENTITY_VERIFIED"
    ) {
      return 3;
    }

    // Level 2 Check: Email verified
    if (user.emailVerified || user.verificationStatus === "EMAIL_VERIFIED") {
      return 2;
    }

    // Level 1: Default for new registered users
    return 1;
  }

  /**
   * Checks if user satisfies the required minimum trust level
   */
  public static hasMinTrustLevel(user: UserAccountModel, requiredLevel: TrustLevel): boolean {
    const userLevel = user.trustLevel ?? this.evaluateTrustLevel(user);
    return userLevel >= requiredLevel;
  }
}
