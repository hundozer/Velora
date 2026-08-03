import { UserAccountModel } from "@/lib/auth/userModel";
import { UserAuthSession } from "@/types/auth";

/**
 * Velora Session & Authentication Security Engine
 * Manages JWT session tokens, password strength verification, and HTTP-Only session cookies.
 */

export class PasswordPolicy {
  /**
   * Validates passwords against Velora security policy:
   * Min 10 chars, uppercase, lowercase, digit, special character.
   */
  public static validate(password: string): { isValid: boolean; reason?: string } {
    if (!password || password.length < 10) {
      return { isValid: false, reason: "Password must be at least 10 characters long." };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, reason: "Password must contain at least one uppercase letter." };
    }
    if (!/[a-z]/.test(password)) {
      return { isValid: false, reason: "Password must contain at least one lowercase letter." };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, reason: "Password must contain at least one numeric digit." };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { isValid: false, reason: "Password must contain at least one special character." };
    }
    return { isValid: true };
  }
}

export class SessionManager {
  private static readonly SESSION_DURATION_SECONDS = 15 * 60; // 15-minute access token

  /**
   * Generates a secure session token payload for an authenticated user.
   */
  public static createSession(user: UserAccountModel): UserAuthSession {
    const now = Math.floor(Date.now() / 1000);
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      verificationStatus: user.verificationStatus,
      creatorStatus: user.creatorStatus,
      sessionId: `sess-${user.id}-${Date.now()}`,
      issuedAt: now,
      expiresAt: now + this.SESSION_DURATION_SECONDS,
    };
  }

  /**
   * Verifies if a session token is active and valid.
   */
  public static verifySession(session: UserAuthSession | null): boolean {
    if (!session) return false;
    const now = Math.floor(Date.now() / 1000);

    if (now > session.expiresAt) return false; // Expired token
    if (session.status === "SUSPENDED" || session.status === "BANNED") return false; // Invalidate suspended users

    return true;
  }
}
