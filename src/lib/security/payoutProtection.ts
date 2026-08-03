/**
 * Creator Payout Protection & 2FA Hold Utility
 * Enforces earning holding periods and TOTP 2FA verification for bank/crypto account updates.
 */

export interface PayoutSecurityStatus {
  creatorId: string;
  totalEarnings: number;
  availableForPayout: number;
  pendingHoldEarnings: number;
  is2FAEnabled: boolean;
  payoutMethodLastChangedDaysAgo: number;
}

export interface PayoutValidationResult {
  canRequestPayout: boolean;
  holdReason?: string;
  requiredAction?: "NONE" | "ENABLE_2FA" | "WAIT_PAYOUT_LOCK";
}

/**
 * Validates payout eligibility and mandatory security holds
 */
export function validateCreatorPayoutEligibility(
  status: PayoutSecurityStatus,
  requestedAmount: number
): PayoutValidationResult {
  // 1. Mandatory 2FA Verification Check
  if (!status.is2FAEnabled) {
    return {
      canRequestPayout: false,
      holdReason: "Mandatory TOTP Two-Factor Authentication (2FA) must be enabled to process payouts.",
      requiredAction: "ENABLE_2FA",
    };
  }

  // 2. Recent Payout Details Modification Lock (72-hour lock after changing IBAN/wallet)
  if (status.payoutMethodLastChangedDaysAgo < 3) {
    return {
      canRequestPayout: false,
      holdReason: "Payout destination changed recently. Security lock active for 72 hours.",
      requiredAction: "WAIT_PAYOUT_LOCK",
    };
  }

  // 3. Earnings Holding Period Check
  if (requestedAmount > status.availableForPayout) {
    return {
      canRequestPayout: false,
      holdReason: `Requested amount (€${requestedAmount}) exceeds cleared balance (€${status.availableForPayout}). Remaining earnings are undergoing standard 7-day fraud verification.`,
      requiredAction: "NONE",
    };
  }

  return {
    canRequestPayout: true,
    requiredAction: "NONE",
  };
}
