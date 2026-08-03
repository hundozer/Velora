import { UserAccountModel } from "@/lib/auth/userModel";
import { Auth0TokenPayload } from "./tokenValidator";
import { userStore } from "./userStore";

export class UserSynchronizationService {
  /**
   * Synchronizes an Auth0 authenticated identity with Velora's local database representation.
   * Rule: One Auth0 identity = one Velora account. Prevent duplicate user creation.
   */
  public static syncAuth0User(auth0Payload: Partial<Auth0TokenPayload>): UserAccountModel {
    const auth0UserId = auth0Payload.sub || `auth0|fallback_${Date.now()}`;
    const email = auth0Payload.email || `user_${Date.now()}@intimo.live`;
    const isEmailVerified = auth0Payload.email_verified ?? false;

    // 1. Check if user already exists by auth0_user_id
    let existingUser = userStore.findByAuth0Id(auth0UserId);

    if (existingUser) {
      existingUser.lastLoginAt = new Date().toISOString();
      existingUser.emailVerified = isEmailVerified;
      if (isEmailVerified && existingUser.status === "PENDING_VERIFICATION") {
        existingUser.status = "ACTIVE";
      }
      return userStore.save(existingUser);
    }

    // 2. Check if user exists by email (link accounts to prevent duplicates)
    existingUser = userStore.findByEmail(email);

    if (existingUser) {
      existingUser.auth0_user_id = auth0UserId;
      existingUser.lastLoginAt = new Date().toISOString();
      existingUser.emailVerified = isEmailVerified;
      if (isEmailVerified && existingUser.status === "PENDING_VERIFICATION") {
        existingUser.status = "ACTIVE";
      }
      return userStore.save(existingUser);
    }

    // 3. Create a new Velora UserAccount linked to Auth0
    const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newUser: UserAccountModel = {
      id: newUserId,
      auth0_user_id: auth0UserId,
      authProviderId: auth0UserId,
      email: email.toLowerCase(),
      emailVerified: isEmailVerified,
      role: "MEMBER",
      status: isEmailVerified ? "ACTIVE" : "PENDING_VERIFICATION",
      verificationStatus: isEmailVerified ? "EMAIL_VERIFIED" : "UNVERIFIED",
      creatorStatus: "NONE",
      twoFactorEnabled: false,
      preferredLanguage: "en",
      trustLevel: isEmailVerified ? 2 : 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    return userStore.save(newUser);
  }

  public static getUserByAuth0Id(auth0UserId: string): UserAccountModel | undefined {
    return userStore.findByAuth0Id(auth0UserId);
  }

  public static getUserByEmail(email: string): UserAccountModel | undefined {
    return userStore.findByEmail(email);
  }
}
