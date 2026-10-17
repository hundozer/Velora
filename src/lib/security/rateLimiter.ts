/**
 * API Rate Limiting & DM Trust Gate Utility
 * Protects endpoints against brute force, bot crawlers, and automated messaging spam.
 */

import { getServerSupabase } from "@/lib/supabase/server";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();
// When the durable function is missing (migration not applied) or Postgres errors,
// fall back to per-instance memory for a few minutes instead of failing requests.
let durableUnavailableUntil = 0;

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

function checkInMemory(identifier: string, limit: number, windowSeconds: number): RateLimitCheckResult {
  const now = Math.floor(Date.now() / 1000);
  const record = rateLimitMap.get(identifier);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowSeconds });
    return { allowed: true, remaining: limit - 1, resetInSeconds: windowSeconds };
  }
  if (record.count >= limit) return { allowed: false, remaining: 0, resetInSeconds: record.resetTime - now };
  record.count += 1;
  return { allowed: true, remaining: limit - record.count, resetInSeconds: record.resetTime - now };
}

/**
 * Rate limit shared by every serverless instance (P1-13), via the Postgres
 * function intimo_rate_limit_hit. Falls back to in-memory limiting if the
 * database is unavailable, so a limiter outage never takes endpoints down.
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 30,
  windowSeconds: number = 60
): Promise<RateLimitCheckResult> {
  const db = Date.now() >= durableUnavailableUntil ? getServerSupabase() : null;
  if (db) {
    const { data, error } = await db.rpc("intimo_rate_limit_hit", { p_key: identifier.slice(0, 200), p_limit: limit, p_window_seconds: windowSeconds });
    const row = Array.isArray(data) ? data[0] : data;
    if (!error && row && typeof row.allowed === "boolean") {
      return { allowed: row.allowed, remaining: Math.max(0, limit - Number(row.hits)), resetInSeconds: Number(row.reset_in_seconds) || windowSeconds };
    }
    durableUnavailableUntil = Date.now() + 5 * 60 * 1000;
    console.error("Durable rate limit unavailable; using in-memory fallback", { code: error?.code });
  }
  return checkInMemory(identifier, limit, windowSeconds);
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
