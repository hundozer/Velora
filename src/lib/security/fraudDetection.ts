/**
 * Payment Fraud Scoring & 3DS Gate Utility
 * Evaluates payment risk metrics, velocity checks, and 3DS2 status to prevent chargeback fraud.
 */

export interface PaymentRiskPayload {
  userId: string;
  amount: number;
  currency: string;
  ipAddress: string;
  is3DSVerified: boolean;
  cardCountry: string;
  recentTransactionCount24h: number;
}

export interface FraudEvaluationResult {
  allowed: boolean;
  riskScore: number; // 0 (Lowest risk) to 100 (Highest risk)
  requiresManualReview: boolean;
  rejectionReason?: string;
  actionRequired?: "NONE" | "CHALLENGE_3DS" | "BLOCK_TRANSACTION";
}

/**
 * Evaluates payment transaction fraud risk score
 */
export function evaluatePaymentFraudRisk(payload: PaymentRiskPayload): FraudEvaluationResult {
  let riskScore = 0;

  // 1. Mandatory 3-D Secure Verification Gate
  if (!payload.is3DSVerified) {
    return {
      allowed: false,
      riskScore: 85,
      requiresManualReview: false,
      rejectionReason: "3-D Secure 2.0 authentication is required for all card payments.",
      actionRequired: "CHALLENGE_3DS",
    };
  }

  // 2. High Amount Threshold Check
  if (payload.amount > 500) {
    riskScore += 25;
  }

  // 3. Velocity Check (More than 5 top-ups in 24h)
  if (payload.recentTransactionCount24h > 5) {
    riskScore += 40;
  }

  // 4. Decision Gate
  if (riskScore >= 75) {
    return {
      allowed: false,
      riskScore,
      requiresManualReview: true,
      rejectionReason: "High transaction risk score. Payment flagged by automated risk engine.",
      actionRequired: "BLOCK_TRANSACTION",
    };
  }

  return {
    allowed: true,
    riskScore,
    requiresManualReview: riskScore > 40,
    actionRequired: "NONE",
  };
}
