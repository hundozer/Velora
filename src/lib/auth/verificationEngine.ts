import { VerificationStatus } from "@/types/auth";
import { UserAccountModel } from "@/lib/auth/userModel";

export class VerificationEngine {
  /**
   * Evaluates Level 3 Biometric Identity Verification Requirements
   */
  public static verifyUserBiometricStatus(user: UserAccountModel): {
    isVerified: boolean;
    level: VerificationStatus;
  } {
    if (user.verificationStatus === "LEVEL_3_BIOMETRIC") {
      return { isVerified: true, level: "LEVEL_3_BIOMETRIC" };
    }
    if (user.verificationStatus === "IDENTITY_VERIFIED") {
      return { isVerified: true, level: "IDENTITY_VERIFIED" };
    }
    return { isVerified: false, level: user.verificationStatus };
  }

  /**
   * Evaluates 18 U.S.C. 2257 Creator Monetization Eligibility
   */
  public static isCreatorEligibleForMonetization(
    user: UserAccountModel,
    taxForm2257Verified: boolean
  ): boolean {
    if (user.status !== "ACTIVE") return false;
    if (!taxForm2257Verified) return false;
    if (user.creatorStatus !== "APPROVED") return false;

    return (
      user.verificationStatus === "LEVEL_3_BIOMETRIC" ||
      user.verificationStatus === "IDENTITY_VERIFIED"
    );
  }
}
