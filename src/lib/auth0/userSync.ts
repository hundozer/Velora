import { UserAccountModel, createUserAccount } from "@/lib/auth/userModel";
import { Auth0TokenPayload } from "./tokenValidator";
import { userStore } from "./userStore";

export class UserSynchronizationService {
  /**
   * Synchronizes an Auth0 authenticated identity with Intimo's local database representation.
   * Rules:
   * 1. One Auth0 identity (sub) = one Intimo account.
   * 2. Prevent duplicate user creation.
   * 3. Set profile_completed: false for new accounts.
   */
  public static syncAuth0User(auth0Payload: Partial<Auth0TokenPayload>): UserAccountModel {
    const auth0UserId = auth0Payload.sub || `auth0|fallback_${Date.now()}`;
    const email = (auth0Payload.email || `user_${Date.now()}@intimo.live`).toLowerCase();
    const isEmailVerified = auth0Payload.email_verified ?? false;
    const now = new Date().toISOString();

    // 1. Search by auth0_user_id (exact identity match)
    let existingUser = userStore.findByAuth0Id(auth0UserId);

    if (existingUser) {
      existingUser.last_login = now;
      existingUser.lastLoginAt = now;
      existingUser.email_verified = isEmailVerified;
      existingUser.emailVerified = isEmailVerified;
      if (isEmailVerified && (existingUser.status === "PENDING_VERIFICATION" || existingUser.account_status === "PENDING_VERIFICATION")) {
        existingUser.status = "ACTIVE";
        existingUser.account_status = "ACTIVE";
      }
      return userStore.save(existingUser);
    }

    // 2. Search by email (link federated identity to existing account to avoid duplicates)
    existingUser = userStore.findByEmail(email);

    if (existingUser) {
      existingUser.auth0_user_id = auth0UserId;
      existingUser.authProviderId = auth0UserId;
      existingUser.last_login = now;
      existingUser.lastLoginAt = now;
      existingUser.email_verified = isEmailVerified;
      existingUser.emailVerified = isEmailVerified;
      if (isEmailVerified && (existingUser.status === "PENDING_VERIFICATION" || existingUser.account_status === "PENDING_VERIFICATION")) {
        existingUser.status = "ACTIVE";
        existingUser.account_status = "ACTIVE";
      }
      return userStore.save(existingUser);
    }

    // 3. Create a new Intimo UserAccount linked to Auth0 with profile_completed: false
    const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const newUser = createUserAccount({
      id: newUserId,
      auth0_user_id: auth0UserId,
      authProviderId: auth0UserId,
      email,
      email_verified: isEmailVerified,
      emailVerified: isEmailVerified,
      role: "MEMBER",
      account_status: isEmailVerified ? "ACTIVE" : "PENDING_VERIFICATION",
      status: isEmailVerified ? "ACTIVE" : "PENDING_VERIFICATION",
      verificationStatus: isEmailVerified ? "EMAIL_VERIFIED" : "UNVERIFIED",
      creatorStatus: "NONE",
      twoFactorEnabled: false,
      preferred_language: "en",
      preferredLanguage: "en",
      profile_completed: false, // New registrants start with uncompleted onboarding
      trustLevel: isEmailVerified ? 2 : 1,
      created_at: now,
      createdAt: now,
      last_login: now,
      lastLoginAt: now,
    });

    return userStore.save(newUser);
  }

  public static getUserByAuth0Id(auth0UserId: string): UserAccountModel | undefined {
    return userStore.findByAuth0Id(auth0UserId);
  }

  public static getUserByEmail(email: string): UserAccountModel | undefined {
    return userStore.findByEmail(email.toLowerCase());
  }

  public static markProfileCompleted(userId: string): UserAccountModel | undefined {
    const user = userStore.findById(userId);
    if (user) {
      user.profile_completed = true;
      user.updatedAt = new Date().toISOString();
      return userStore.save(user);
    }
    return undefined;
  }
}
