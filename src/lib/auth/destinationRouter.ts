import { UserAccountModel } from "@/lib/auth/userModel";

export class DestinationRouterService {
  /**
   * Resolves the target redirect URL post-authentication based on Intimo application user state.
   * Required for non-enterprise Auth0 tenants where resultUrl customization in email templates is unavailable.
   */
  public static getDestinationUrl(user: UserAccountModel): string {
    // 1. Check if user profile onboarding is incomplete
    if (!user.profile_completed) {
      return "/onboarding";
    }

    // 2. Check if user is a creator undergoing creator studio onboarding/approval
    if (user.role === "CREATOR" && user.creatorStatus !== "APPROVED") {
      return "/creator-studio";
    }

    // 3. Authenticated existing user with completed profile
    return "/dashboard";
  }
}
