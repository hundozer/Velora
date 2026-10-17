/**
 * API Rate Limiting & DM Trust Gate Utility
 * Protects endpoints against brute force, bot crawlers, and automated messaging spam.
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Checks per-client rate limit
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 30, // Default 30 requests
  windowSeconds: number = 60 // Default 60 seconds window
): RateLimitCheckResult {
  const now = Math.floor(Date.now() / 1000);
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + windowSeconds,
    };
    rateLimitMap.set(identifier, newRecord);
    return {
      allowed: true,
      remaining: limit - 1,
      resetInSeconds: windowSeconds,
    };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: record.resetTime - now,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetInSeconds: record.resetTime - now,
  };
}

export interface DMTrustGateOptions {
  senderVerificationLevel: string; // e.g. LEVEL_3_PROFILE_BIOMETRIC
  recipientRequireVerification: boolean;
  isMutualFavorite: boolean;
}

/**
 * Validates direct messaging trust gate
 */
export function validateDMTrustGate(options: DMTrustGateOptions): {
  canSendDM: boolean;
  blockReason?: string;
} {
  if (options.isMutualFavorite) {
    return { canSendDM: true };
  }

  if (
    options.recipientRequireVerification &&
    options.senderVerificationLevel !== "LEVEL_3_PROFILE_BIOMETRIC"
  ) {
    return {
      canSendDM: false,
      blockReason: "Recipient requires Photo Verified members for direct messages.",
    };
  }

  return { canSendDM: true };
}
