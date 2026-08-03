import { UserSynchronizationService } from "@/lib/auth0/userSync";
import { JwtValidatorService } from "@/lib/auth0/tokenValidator";
import { validateApiRequest } from "@/lib/auth/apiMiddleware";
import { TrustLevelEngine } from "@/lib/auth/trustLevels";
import { hasPermission } from "@/lib/auth/permissions";
import { UserAccountModel, createUserAccount } from "@/lib/auth/userModel";

/**
 * Velora Automated Security & Authentication Test Suite
 */
export function runAuth0SecurityVerificationSuite() {
  const results: { test: string; status: "PASS" | "FAIL"; details?: string }[] = [];

  // Test 1: Auth0 User Sync creates account on first login
  try {
    const auth0Payload = {
      sub: "auth0|test_user_1001",
      email: "test.user@velora.club",
      email_verified: true,
      iss: "https://simpleafiedeu.eu.auth0.com/",
      aud: "2wfjGUy76NmH8rdoxXxqg8CrbchkutTl",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    const syncedUser = UserSynchronizationService.syncAuth0User(auth0Payload);
    if (syncedUser.auth0_user_id === "auth0|test_user_1001" && syncedUser.email === "test.user@velora.club") {
      results.push({ test: "Auth0 User Sync on First Login", status: "PASS" });
    } else {
      results.push({ test: "Auth0 User Sync on First Login", status: "FAIL", details: "Mismatched user payload" });
    }
  } catch (err: any) {
    results.push({ test: "Auth0 User Sync on First Login", status: "FAIL", details: err.message });
  }

  // Test 2: User Sync prevents duplicate accounts (1 Auth0 identity = 1 Velora account)
  try {
    const duplicatePayload = {
      sub: "auth0|test_user_1001",
      email: "test.user@velora.club",
      email_verified: true,
    };
    const secondSync = UserSynchronizationService.syncAuth0User(duplicatePayload);
    const count = UserSynchronizationService.getUserByAuth0Id("auth0|test_user_1001");
    if (secondSync.id === count?.id) {
      results.push({ test: "Prevent Duplicate Accounts (1 Identity = 1 Account)", status: "PASS" });
    } else {
      results.push({ test: "Prevent Duplicate Accounts", status: "FAIL", details: "Created duplicate ID" });
    }
  } catch (err: any) {
    results.push({ test: "Prevent Duplicate Accounts", status: "FAIL", details: err.message });
  }

  // Test 3: Expired JWT validation is rejected
  try {
    const expiredHeader = "Bearer " + Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url") +
      "." +
      Buffer.from(JSON.stringify({
        sub: "auth0|expired",
        exp: Math.floor(Date.now() / 1000) - 3600,
        iss: "https://simpleafiedeu.eu.auth0.com/",
      })).toString("base64url") +
      ".signature";

    const validation = JwtValidatorService.validateAuth0Token(expiredHeader);
    if (!validation.isValid && validation.message.includes("expired")) {
      results.push({ test: "Expired JWT Token Rejection", status: "PASS" });
    } else {
      results.push({ test: "Expired JWT Token Rejection", status: "FAIL", details: "Expired token was accepted" });
    }
  } catch (err: any) {
    results.push({ test: "Expired JWT Token Rejection", status: "FAIL", details: err.message });
  }

  // Test 4: Suspended users are blocked by API middleware
  try {
    const suspendedUser: UserAccountModel = createUserAccount({
      id: "usr-suspended",
      email: "banned@velora.club",
      status: "SUSPENDED",
    });

    validateApiRequest(suspendedUser).then((res) => {
      if (!res.authorized && res.statusCode === 403 && res.message.includes("SUSPENDED")) {
        results.push({ test: "Suspended User API Gate Blocking", status: "PASS" });
      } else {
        results.push({ test: "Suspended User API Gate Blocking", status: "FAIL", details: "Suspended user was allowed" });
      }
    });
  } catch (err: any) {
    results.push({ test: "Suspended User API Gate Blocking", status: "FAIL", details: err.message });
  }

  // Test 5: Role permission check — creators cannot access admin features
  try {
    const creatorUser: UserAccountModel = createUserAccount({
      id: "usr-creator",
      email: "creator@velora.club",
      role: "CREATOR",
    });

    const hasAdminPerm = hasPermission(creatorUser.role, "admin:system:manage");
    if (!hasAdminPerm) {
      results.push({ test: "Role Isolation (Creator Cannot Access Admin Features)", status: "PASS" });
    } else {
      results.push({ test: "Role Isolation", status: "FAIL", details: "Creator granted admin permission" });
    }
  } catch (err: any) {
    results.push({ test: "Role Isolation", status: "FAIL", details: err.message });
  }

  // Test 6: IDOR Resource Ownership Validation
  try {
    const userA = createUserAccount({ id: "usr-A", email: "a@velora.club" });
    const ownershipCheck = (payload: any, user: UserAccountModel) => payload.ownerId === user.id;

    validateApiRequest(userA, { ownershipCheck }, { ownerId: "usr-B" }).then((res) => {
      if (!res.authorized && res.statusCode === 403 && res.message.includes("do not own")) {
        results.push({ test: "IDOR Ownership Protection Gate", status: "PASS" });
      } else {
        results.push({ test: "IDOR Ownership Protection Gate", status: "FAIL", details: "IDOR bypass allowed" });
      }
    });
  } catch (err: any) {
    results.push({ test: "IDOR Ownership Protection Gate", status: "FAIL", details: err.message });
  }

  // Test 7: Trust Level Evaluation Engine
  try {
    const unverifiedUser = createUserAccount({ id: "usr-new", email: "new@velora.club", emailVerified: false });
    const verifiedUser = createUserAccount({ id: "usr-v2", email: "v2@velora.club", emailVerified: true });
    
    const lvl1 = TrustLevelEngine.evaluateTrustLevel(unverifiedUser);
    const lvl2 = TrustLevelEngine.evaluateTrustLevel(verifiedUser);

    if (lvl1 === 1 && lvl2 === 2) {
      results.push({ test: "Trust Level Evaluation System (Levels 1 & 2)", status: "PASS" });
    } else {
      results.push({ test: "Trust Level Evaluation System", status: "FAIL", details: `lvl1=${lvl1}, lvl2=${lvl2}` });
    }
  } catch (err: any) {
    results.push({ test: "Trust Level Evaluation System", status: "FAIL", details: err.message });
  }

  return results;
}
