import { UserAccountModel, createUserAccount } from "@/lib/auth/userModel";
import { DecodedAuth0JwtPayload } from "@/lib/auth/jwtValidator";
import { auditLogger } from "@/lib/auth/auditLogger";

export interface VeloraDbUserRecord {
  id: string;
  auth0_user_id: string;
  email: string;
  email_verified: boolean;
  account_status: "ACTIVE" | "PENDING_VERIFICATION" | "RESTRICTED" | "SUSPENDED" | "BANNED" | "DELETED";
  preferred_language: string;
  created_at: string;
  last_login: string;
  profile_completed: boolean;
}

// In-Memory Database Store for Local Users linked to Auth0
const LOCAL_USER_DB = new Map<string, VeloraDbUserRecord>();

export class UserSynchronizationService {
  /**
   * Synchronizes an authenticated Auth0 identity payload with Velora's database.
   * Ensures 1 Auth0 identity = 1 Velora account and prevents duplicate account creation.
   */
  public static syncAuth0User(payload: DecodedAuth0JwtPayload): VeloraDbUserRecord {
    const auth0UserId = payload.sub;
    const email = payload.email.toLowerCase();
    const now = new Date().toISOString();

    // 1. Lookup existing record by Auth0 User ID
    let userRecord = LOCAL_USER_DB.get(auth0UserId);

    if (userRecord) {
      // Update last login and email verification status
      userRecord.last_login = now;
      userRecord.email_verified = payload.email_verified;
      LOCAL_USER_DB.set(auth0UserId, userRecord);
      return userRecord;
    }

    // 2. Prevent duplicate accounts by checking email existence
    const existingByEmail = Array.from(LOCAL_USER_DB.values()).find((u) => u.email === email);
    if (existingByEmail) {
      // Link Auth0 ID to existing record
      existingByEmail.auth0_user_id = auth0UserId;
      existingByEmail.last_login = now;
      existingByEmail.email_verified = payload.email_verified;
      LOCAL_USER_DB.set(auth0UserId, existingByEmail);
      return existingByEmail;
    }

    // 3. Create new synchronized Velora user record
    const newVeloraId = `usr-vdb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    userRecord = {
      id: newVeloraId,
      auth0_user_id: auth0UserId,
      email,
      email_verified: payload.email_verified,
      account_status: payload.email_verified ? "ACTIVE" : "PENDING_VERIFICATION",
      preferred_language: "en",
      created_at: now,
      last_login: now,
      profile_completed: false,
    };

    LOCAL_USER_DB.set(auth0UserId, userRecord);

    auditLogger.logEvent({
      actorId: userRecord.id,
      actorRole: "MEMBER",
      action: "AUTH0_USER_SYNCED_AND_CREATED",
      status: "SUCCESS",
      details: { auth0_user_id: auth0UserId, email },
    });

    return userRecord;
  }

  /**
   * Retrieves local user record by Auth0 ID
   */
  public static getUserByAuth0Id(auth0UserId: string): VeloraDbUserRecord | undefined {
    return LOCAL_USER_DB.get(auth0UserId);
  }

  /**
   * Converts a database record into a Velora UserAccountModel
   */
  public static toUserAccountModel(dbUser: VeloraDbUserRecord): UserAccountModel {
    return createUserAccount({
      id: dbUser.id,
      auth0_user_id: dbUser.auth0_user_id,
      email: dbUser.email,
      role: "MEMBER",
      status: dbUser.account_status,
      verificationStatus: dbUser.email_verified ? "IDENTITY_VERIFIED" : "UNVERIFIED",
    });
  }
}
