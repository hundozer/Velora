"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PaymentService } from "@/lib/payment/PaymentService";
import { MOCK_WALLET } from "@/lib/mockData";
import { Lock, ShieldCheck, CheckCircle2, Wallet, CreditCard, Sparkles, Receipt } from "lucide-react";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle: string;
  creatorName: string;
  grossAmount: number;
  type: "CREATOR_SUBSCRIPTION" | "PREMIUM_ALBUM_UNLOCK" | "PRIVATE_VIDEO_UNLOCK";
  onSuccessUnlock?: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  productTitle,
  creatorName,
  grossAmount,
  type,
  onSuccessUnlock,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<"VELORA_WALLET" | "STRIPE_CONNECT">("VELORA_WALLET");
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedTx, setCompletedTx] = useState<any | null>(null);

  const split = PaymentService.calculateCommission(grossAmount, true);

  const handleProcessPayment = () => {
    setIsProcessing(true);

    setTimeout(() => {
      const tx = PaymentService.confirmPayment(
        "elena_vance",
        creatorName.toLowerCase().replace(/\s+/g, "_"),
        productTitle,
        grossAmount,
        type,
        paymentMethod
      );

      setIsProcessing(false);
      setCompletedTx(tx);
      if (onSuccessUnlock) onSuccessUnlock();
    }, 1500);
  };

  const handleReset = () => {
    setCompletedTx(null);
    setIsProcessing(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleReset} title="Velora Secure Checkout & Access Unlock">
      {completedTx ? (
        <div className="text-center space-y-4 py-6 text-left">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-xl font-serif font-bold text-velora-textPrimary text-center">
            Payment Completed & Unlocked!
          </h3>
          <p className="text-xs text-velora-textMuted leading-relaxed glass-panel p-4 rounded-2xl">
            You now have permanent unlocked access to <strong>"{productTitle}"</strong> by {creatorName}. Transaction reference: <strong className="font-mono text-velora-gold">{completedTx.id}</strong>.
          </p>

          <div className="p-4 glass-panel rounded-2xl text-xs text-velora-textSecondary space-y-1 font-mono text-left">
            <div className="flex justify-between">
              <span>Gross Amount Paid:</span>
              <span className="font-bold text-velora-textPrimary">${completedTx.grossAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-velora-textMuted">
              <span>5% Compliance Tax:</span>
              <span>${completedTx.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-velora-textMuted">
              <span>Payment Provider:</span>
              <span>{completedTx.provider}</span>
            </div>
          </div>

          <Button variant="gold" size="sm" className="w-full font-bold uppercase" onClick={handleReset}>
            Close & Access Content
          </Button>
        </div>
      ) : (
        <div className="space-y-6 text-left">
          {/* Order Summary Box */}
          <div className="p-5 glass-panel-gold rounded-2xl border border-velora-gold/40 space-y-3">
            <div className="flex items-center justify-between">
              <Badge type="custom" label={type.replace(/_/g, " ")} className="bg-amber-500/20 text-amber-300 border-amber-500/40" />
              <span className="text-2xl font-serif font-bold text-velora-gold">${grossAmount.toFixed(2)}</span>
            </div>

            <div>
              <h4 className="text-base font-serif font-bold text-velora-textPrimary">{productTitle}</h4>
              <p className="text-xs text-velora-textMuted mt-0.5">Creator: {creatorName}</p>
            </div>

            <div className="pt-3 border-t border-white/10 text-xs text-velora-textMuted space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Subtotal Price:</span>
                <span>${(grossAmount - split.taxAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Compliance Tax (5%):</span>
                <span>${split.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-velora-textPrimary pt-1 border-t border-white/5">
                <span>Total Amount Due:</span>
                <span className="text-velora-gold">${grossAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary">
              Select Payment Method
            </label>

            {/* Velora Wallet */}
            <div
              onClick={() => setPaymentMethod("VELORA_WALLET")}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                paymentMethod === "VELORA_WALLET"
                  ? "glass-panel-gold border-velora-gold shadow-gold-glow"
                  : "glass-panel hover:border-white/20"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-velora-gold/10 text-velora-gold">
                  <Wallet className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-velora-textPrimary">Velora Vault Wallet</p>
                  <p className="text-velora-textMuted text-[11px]">Available Balance: ${MOCK_WALLET.availableBalance.toFixed(2)}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Instant Unlock
              </span>
            </div>

            {/* Credit Card / Stripe */}
            <div
              onClick={() => setPaymentMethod("STRIPE_CONNECT")}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                paymentMethod === "STRIPE_CONNECT"
                  ? "glass-panel-gold border-velora-gold shadow-gold-glow"
                  : "glass-panel hover:border-white/20"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-velora-textPrimary">Credit Card / Apple Pay</p>
                  <p className="text-velora-textMuted text-[11px]">256-bit encrypted checkout via Stripe</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="w-1/3 text-xs" onClick={handleReset}>
              Cancel
            </Button>
            <Button
              variant="gold"
              className="w-2/3 text-xs font-bold uppercase tracking-wider gap-2 shadow-gold-glow"
              disabled={isProcessing}
              onClick={handleProcessPayment}
            >
              <Lock className="w-4 h-4" />
              {isProcessing ? "Processing..." : `Confirm Payment $${grossAmount.toFixed(2)}`}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
