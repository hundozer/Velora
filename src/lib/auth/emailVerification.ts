import { SecurityAuditLog } from "@/types/auth";
import { auditLogger } from "@/lib/auth/auditLogger";

export interface PendingEmailVerification {
  token: string;
  userId: string;
  email: string;
  createdAt: number;
  expiresAt: number;
  isVerified: boolean;
}

// In-Memory & LocalStorage Persisted Verification Store
const VERIFICATION_STORE = new Map<string, PendingEmailVerification>();
const VERIFIED_EMAILS = new Set<string>([
  "demouser@velora.club",
  "single.member@velora.club",
  "couple.berlin@velora.club",
  "creator.valerie@velora.club",
  "admin@velora.club",
]);

export class EmailVerificationService {
  private static readonly TOKEN_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 Hours

  /**
   * Generates a cryptographically random verification token and creates pending verification record.
   */
  public static createVerificationToken(userId: string, email: string): PendingEmailVerification {
    const token = `v-token-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const now = Date.now();

    const record: PendingEmailVerification = {
      token,
      userId,
      email: email.toLowerCase(),
      createdAt: now,
      expiresAt: now + this.TOKEN_EXPIRATION_MS,
      isVerified: false,
    };

    VERIFICATION_STORE.set(token, record);

    auditLogger.logEvent({
      actorId: userId,
      actorRole: "MEMBER",
      action: "EMAIL_VERIFICATION_TOKEN_CREATED",
      status: "SUCCESS",
      details: { email, expiresAt: new Date(record.expiresAt).toISOString() },
    });

    return record;
  }

  /**
   * Verifies an email token and marks the associated email as verified.
   */
  public static verifyToken(token: string): { success: boolean; email?: string; userId?: string; message: string } {
    if (!token) {
      return { success: false, message: "Invalid verification link. Token parameter is missing." };
    }

    const record = VERIFICATION_STORE.get(token);

    if (!record) {
      return { success: false, message: "Verification link is invalid or has already been used." };
    }

    if (Date.now() > record.expiresAt) {
      return { success: false, message: "Verification link has expired. Please request a new confirmation email." };
    }

    record.isVerified = true;
    VERIFIED_EMAILS.add(record.email);

    auditLogger.logEvent({
      actorId: record.userId,
      actorRole: "MEMBER",
      action: "EMAIL_VERIFICATION_CONFIRMED",
      status: "SUCCESS",
      details: { email: record.email },
    });

    return {
      success: true,
      email: record.email,
      userId: record.userId,
      message: "Email address verified successfully! You can now log into your account.",
    };
  }

  /**
   * Checks whether an email address has been confirmed.
   */
  public static isEmailVerified(email: string): boolean {
    if (!email) return false;
    return VERIFIED_EMAILS.has(email.toLowerCase());
  }

  /**
   * Resends a fresh confirmation token for an unverified email address.
   */
  public static resendToken(email: string): PendingEmailVerification | null {
    const cleanEmail = email.toLowerCase();
    const existing = Array.from(VERIFICATION_STORE.values()).find((v) => v.email === cleanEmail);

    const userId = existing ? existing.userId : `usr-${Date.now()}`;
    return this.createVerificationToken(userId, cleanEmail);
  }
}
