import { UserAccountModel } from "@/lib/auth/userModel";
import { UserRole, Permission } from "@/types/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { AuthorizationService } from "@/lib/auth/AuthorizationService";
import { auditLogger } from "@/lib/auth/auditLogger";
import { JwtValidatorService } from "@/lib/auth0/tokenValidator";
import { UserSynchronizationService } from "@/lib/auth0/userSync";
import { TrustLevelEngine, TrustLevel } from "@/lib/auth/trustLevels";

export interface ProtectedApiRequestOptions {
  requireAuth?: boolean;
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  requireVerification?: boolean;
  requiredTrustLevel?: TrustLevel;
  ownershipCheck?: (req: any, currentUser: UserAccountModel) => Promise<boolean> | boolean;
}

export interface ApiSecurityResult {
  authorized: boolean;
  statusCode: number;
  message: string;
  user?: UserAccountModel;
}

/**
 * Validates server-side Auth0 JWT Bearer Token and synchronizes user
 */
export function validateAuth0BearerToken(bearerHeader: string | undefined): ApiSecurityResult {
  const jwtCheck = JwtValidatorService.validateAuth0Token(bearerHeader);

  if (!jwtCheck.isValid || !jwtCheck.payload) {
    return {
      authorized: false,
      statusCode: jwtCheck.statusCode,
      message: jwtCheck.message,
    };
  }

  // Synchronize authenticated Auth0 identity with Velora local user database
  const dbUser = UserSynchronizationService.syncAuth0User(jwtCheck.payload);

  return {
    authorized: true,
    statusCode: 200,
    message: "Auth0 Bearer Token Verified",
    user: dbUser,
  };
}

/**
 * Enterprise API Protection Guard for API Handlers
 * Evaluates JWT sessions, user status, role permissions, trust levels, and IDOR ownership checks.
 */
export async function validateApiRequest(
  currentUser: UserAccountModel | null,
  options: ProtectedApiRequestOptions = {},
  reqPayload?: any
): Promise<ApiSecurityResult> {
  const {
    requireAuth = true,
    requiredRoles,
    requiredPermissions,
    requireVerification = false,
    requiredTrustLevel,
    ownershipCheck,
  } = options;

  // 1. Authentication Check
  if (requireAuth && !currentUser) {
    auditLogger.logEvent({
      actorId: "GUEST",
      actorRole: "GUEST",
      action: "API_UNAUTHENTICATED_ACCESS_DENIED",
      status: "DENIED",
      details: { options },
    });
    return { authorized: false, statusCode: 401, message: "Unauthorized. Authentication required." };
  }

  if (!currentUser) {
    return { authorized: true, statusCode: 200, message: "Public Access Granted" };
  }

  // 2. Account Status Check (Banning & Suspension Guard)
  if (!AuthorizationService.isAccountActive(currentUser)) {
    auditLogger.logEvent({
      actorId: currentUser.id,
      actorRole: currentUser.role,
      action: "API_SUSPENDED_USER_BLOCKED",
      status: "DENIED",
    });
    return {
      authorized: false,
      statusCode: 403,
      message: `Account is ${currentUser.status}. Access to platform features is restricted.`,
    };
  }

  // 3. Level 3 Verification Check
  if (requireVerification && currentUser.verificationStatus !== "LEVEL_3_BIOMETRIC" && currentUser.verificationStatus !== "IDENTITY_VERIFIED") {
    return {
      authorized: false,
      statusCode: 403,
      message: "Biometric Identity Verification required for this feature.",
    };
  }

  // 4. Trust Level Check
  if (requiredTrustLevel && !TrustLevelEngine.hasMinTrustLevel(currentUser, requiredTrustLevel)) {
    return {
      authorized: false,
      statusCode: 403,
      message: `Trust Level ${requiredTrustLevel} required for this action. Current Trust Level: ${currentUser.trustLevel || 1}.`,
    };
  }

  // 5. Role Hierarchy Check
  if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(currentUser.role)) {
    auditLogger.logEvent({
      actorId: currentUser.id,
      actorRole: currentUser.role,
      action: "API_ROLE_FORBIDDEN",
      status: "DENIED",
      details: { requiredRoles },
    });
    return {
      authorized: false,
      statusCode: 403,
      message: "Forbidden. Your account role does not have permission for this resource.",
    };
  }

  // 6. Granular Permission Check
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every((perm) => hasPermission(currentUser.role, perm));
    if (!hasAllPermissions) {
      auditLogger.logEvent({
        actorId: currentUser.id,
        actorRole: currentUser.role,
        action: "API_PERMISSION_FORBIDDEN",
        status: "DENIED",
        details: { requiredPermissions },
      });
      return {
        authorized: false,
        statusCode: 403,
        message: "Forbidden. Missing required granular permission.",
      };
    }
  }

  // 7. IDOR / BOPA Ownership Check
  if (ownershipCheck) {
    const isOwner = await ownershipCheck(reqPayload, currentUser);
    if (!isOwner && currentUser.role !== "SYSTEM_ADMIN") {
      auditLogger.logEvent({
        actorId: currentUser.id,
        actorRole: currentUser.role,
        action: "API_IDOR_OWNERSHIP_VIOLATION",
        status: "DENIED",
      });
      return {
        authorized: false,
        statusCode: 403,
        message: "Forbidden. You do not own this resource.",
      };
    }
  }

  auditLogger.logEvent({
    actorId: currentUser.id,
    actorRole: currentUser.role,
    action: "API_ACCESS_GRANTED",
    status: "SUCCESS",
  });

  return { authorized: true, statusCode: 200, message: "Authorized", user: currentUser };
}
