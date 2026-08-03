import { PaymentTransaction, PayoutRequest, RefundItem, PaymentType } from "@/types";

export interface CommissionSplit {
  grossAmount: number;
  platformCut: number;
  creatorEarnings: number;
  taxAmount: number;
}

export class PaymentService {
  /**
   * Calculates platform commission & creator payout split.
   * Default: 80% Creator / 20% Platform.
   * Level 4 Verified Creator: 85% Creator / 15% Platform.
   */
  static calculateCommission(grossAmount: number, isLevel4Creator: boolean = true): CommissionSplit {
    const taxRate = 0.05; // 5% Compliance tax line item
    const taxAmount = Number((grossAmount * taxRate).toFixed(2));
    const netVolume = grossAmount - taxAmount;

    const platformRate = isLevel4Creator ? 0.15 : 0.20;
    const platformCut = Number((netVolume * platformRate).toFixed(2));
    const creatorEarnings = Number((netVolume - platformCut).toFixed(2));

    return {
      grossAmount,
      platformCut,
      creatorEarnings,
      taxAmount,
    };
  }

  /**
   * Simulates creating a payment intent across Stripe Connect or Adyen.
   */
  static async createPaymentIntent(
    amount: number,
    type: PaymentType,
    provider: "STRIPE_CONNECT" | "ADYEN" | "VELORA_WALLET" = "STRIPE_CONNECT"
  ) {
    return {
      clientSecret: `pi_velora_${Date.now()}_secret_${Math.random().toString(36).substring(7)}`,
      amount,
      provider,
      status: "requires_confirmation",
    };
  }

  /**
   * Confirms payment and generates completed transaction log.
   */
  static confirmPayment(
    buyerUsername: string,
    sellerUsername: string | undefined,
    productTitle: string,
    grossAmount: number,
    type: PaymentType,
    provider: "STRIPE_CONNECT" | "ADYEN" | "VELORA_WALLET" = "VELORA_WALLET"
  ): PaymentTransaction {
    const split = this.calculateCommission(grossAmount, true);

    return {
      id: "tx-" + Date.now(),
      buyerUsername,
      sellerUsername,
      productTitle,
      grossAmount: split.grossAmount,
      platformCut: split.platformCut,
      creatorEarnings: split.creatorEarnings,
      taxAmount: split.taxAmount,
      currency: "USD",
      type,
      status: "COMPLETED",
      provider,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  }
}
