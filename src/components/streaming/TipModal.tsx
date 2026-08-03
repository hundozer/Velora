"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MOCK_WALLET } from "@/lib/mockData";
import { Sparkles, DollarSign, CheckCircle2, Heart, Lock } from "lucide-react";

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorName: string;
  onTipSent?: (amount: number, message?: string) => void;
}

export const TipModal: React.FC<TipModalProps> = ({
  isOpen,
  onClose,
  creatorName,
  onTipSent,
}) => {
  const [amount, setAmount] = useState("25");
  const [customMessage, setCustomMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [tipSuccess, setTipSuccess] = useState(false);

  const handleSendTip = () => {
    const tipVal = parseFloat(amount) || 0;
    if (tipVal <= 0) return;

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setTipSuccess(true);
      if (onTipSent) onTipSent(tipVal, customMessage);

      setTimeout(() => {
        setTipSuccess(false);
        onClose();
        setCustomMessage("");
      }, 1500);
    }, 1000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Send Virtual Tip to ${creatorName}`}>
      {tipSuccess ? (
        <div className="text-center py-6 space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-lg font-serif font-bold text-velora-textPrimary">
            Tip Sent Successfully!
          </h3>
          <p className="text-xs text-velora-textMuted font-mono">
            ${parseFloat(amount).toFixed(2)} credited to {creatorName}
          </p>
        </div>
      ) : (
        <div className="space-y-5 text-left">
          <div className="p-4 glass-panel-gold rounded-2xl border border-velora-gold/40 flex items-center justify-between text-xs">
            <div>
              <p className="text-velora-textMuted">Available Vault Balance:</p>
              <p className="text-xl font-serif font-bold text-velora-gold">
                ${MOCK_WALLET.availableBalance.toFixed(2)}
              </p>
            </div>
            <Sparkles className="w-6 h-6 text-velora-gold" />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
              Select Tip Amount ($USD)
            </label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {["10", "25", "50", "100"].map((preset) => (
                <Button
                  key={preset}
                  variant={amount === preset ? "gold" : "glass"}
                  size="sm"
                  className="text-xs font-bold"
                  onClick={() => setAmount(preset)}
                >
                  ${preset}
                </Button>
              ))}
            </div>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Custom tip amount"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-1">
              Highlighted Chat Message (Optional)
            </label>
            <textarea
              rows={2}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add a special message to be highlighted in live chat..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-velora-textPrimary focus:outline-none focus:border-velora-gold"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="w-1/3 text-xs" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="gold"
              className="w-2/3 text-xs font-bold uppercase tracking-wider gap-2 shadow-gold-glow"
              disabled={isProcessing}
              onClick={handleSendTip}
            >
              <Heart className="w-4 h-4 fill-velora-bg" />
              {isProcessing ? "Sending..." : `Send Tip $${parseFloat(amount || "0").toFixed(2)}`}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
