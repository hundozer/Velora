import { UserAccountModel } from "@/lib/auth/userModel";

export class DestinationRouterService {
  /**
   * Resolves the target redirect URL post-authentication based on Intimo application user state.
   * Ensures new registrants complete /onboarding, creators visit /creator-studio, and active members land on /dashboard.
   */
  public static getDestinationUrl(user: UserAccountModel): string {
    // 0. Redirect admins straight to /admin
    if ((user.role as any) === "ADMIN" || user.role === "SYSTEM_ADMIN" || user.role === "FINANCE_ADMIN") {
      return "/admin";
    }

    // 1. Redirect to verify-email if user email is unverified
    if (!user.email_verified) {
      return "/verify-email";
    }

    // 2. Check if user profile onboarding is incomplete
    if (!user.profile_completed) {
      return "/onboarding";
    }

    // 2. If user is a creator undergoing creator studio onboarding/approval
    if (user.role === "CREATOR" && user.creatorStatus !== "APPROVED") {
      return "/creator-studio";
    }

    // 3. Authenticated existing user with completed profile
    return "/dashboard";
  }
}
