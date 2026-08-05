"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { MOCK_WALLET, MOCK_TRANSACTIONS } from "@/lib/mockData";
import { PaymentTransaction } from "@/types";
import {
  Wallet,
  DollarSign,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Lock,
  CreditCard,
  CheckCircle2,
  Receipt,
  Clock,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { BehindTheDoorLanding } from "@/components/landing/BehindTheDoorLanding";

export default function WalletPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(MOCK_WALLET);

  if (!user) {
    return <BehindTheDoorLanding />;
  }
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(MOCK_TRANSACTIONS);
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState("100");
  const [isProcessing, setIsProcessing] = useState(false);
  const [topupSuccess, setTopupSuccess] = useState(false);

  const handleAddFunds = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const added = parseFloat(topupAmount) || 0;
      setWallet({
        ...wallet,
        availableBalance: wallet.availableBalance + added,
      });

      const newTx: PaymentTransaction = {
        id: "tx-" + Date.now(),
        buyerUsername: "elena_vance",
        productTitle: "Wallet Top-up (Credit Card)",
        grossAmount: added,
        platformCut: 0,
        creatorEarnings: 0,
        taxAmount: 0,
        currency: "USD",
        type: "WALLET_TOPUP",
        status: "COMPLETED",
        provider: "STRIPE_CONNECT",
        createdAt: "Just now",
      };

      setTransactions([newTx, ...transactions]);
      setIsProcessing(false);
      setTopupSuccess(true);
      setTimeout(() => {
        setTopupSuccess(false);
        setAddFundsOpen(false);
      }, 1500);
    }, 1200);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gold-gradient text-velora-bg shadow-gold-glow">
            <Wallet className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-velora-textPrimary">
              Intimo Private Wallet
            </h1>
            <p className="text-xs text-velora-textSecondary mt-1">
              Encrypted balance manager for discreet creator subscriptions, media unlocks, and payouts.
            </p>
          </div>
        </div>

        <Button
          variant="gold"
          size="lg"
          className="text-xs font-bold uppercase tracking-wider gap-2 shadow-gold-glow shrink-0"
          onClick={() => setAddFundsOpen(true)}
        >
          <Plus className="w-4 h-4" /> Add Funds to Balance
        </Button>
      </div>

      {/* Balance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="goldBorder" className="p-6 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-velora-gold block">
            Available Balance
          </span>
          <span className="text-4xl font-serif font-bold text-velora-textPrimary">
            ${wallet.availableBalance.toFixed(2)}
          </span>
          <p className="text-[11px] text-velora-textMuted font-mono">Ready for instant content unlocks</p>
        </Card>

        <Card variant="glass" className="p-6 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 block">
            Pending Escrow Balance
          </span>
          <span className="text-4xl font-serif font-bold text-velora-textPrimary">
            ${wallet.pendingBalance.toFixed(2)}
          </span>
          <p className="text-[11px] text-velora-textMuted font-mono">Pending verification / clearance</p>
        </Card>

        <Card variant="glass" className="p-6 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-300 block">
            Lifetime Transactions
          </span>
          <span className="text-4xl font-serif font-bold text-velora-textPrimary">
            {transactions.length}
          </span>
          <p className="text-[11px] text-velora-textMuted font-mono">100% Audit trail logged</p>
        </Card>
      </div>

      {/* Transaction History Ledger */}
      <Card variant="glass" className="p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="text-xl font-serif font-bold text-velora-textPrimary flex items-center gap-2">
            <Receipt className="w-5 h-5 text-velora-gold" />
            Wallet Transaction Ledger
          </h2>
          <span className="text-xs text-velora-textMuted font-mono">Encrypted USD Statements</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-velora-textSecondary">
            <thead className="text-[10px] font-bold uppercase tracking-wider text-velora-textMuted border-b border-white/10 pb-2">
              <tr>
                <th className="py-2">Time / Date</th>
                <th className="py-2">Transaction Type</th>
                <th className="py-2">Product / Details</th>
                <th className="py-2">Payment Provider</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="py-3 font-mono text-[11px]">{tx.createdAt}</td>
                  <td className="py-3 font-bold text-velora-textPrimary">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10">
                      {tx.type.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3 text-velora-textPrimary">{tx.productTitle}</td>
                  <td className="py-3 font-mono text-[11px]">{tx.provider}</td>
                  <td className="py-3 font-bold text-velora-gold">${tx.grossAmount.toFixed(2)}</td>
                  <td className="py-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Funds Modal */}
      <Modal isOpen={addFundsOpen} onClose={() => setAddFundsOpen(false)} title="Add Funds to Intimo Wallet">
        {topupSuccess ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-velora-textPrimary">Funds Added to Wallet!</h3>
          </div>
        ) : (
          <div className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold uppercase text-velora-textSecondary mb-1">
                Select Top-up Amount ($USD)
              </label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {["50", "100", "250"].map((amt) => (
                  <Button
                    key={amt}
                    variant={topupAmount === amt ? "gold" : "glass"}
                    size="sm"
                    className="text-xs font-bold"
                    onClick={() => setTopupAmount(amt)}
                  >
                    ${amt}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                placeholder="Custom amount"
              />
            </div>

            <div className="p-4 glass-panel rounded-2xl border border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-velora-gold" />
                <div>
                  <p className="font-bold text-velora-textPrimary">Credit Card / Apple Pay</p>
                  <p className="text-velora-textMuted text-[10px]">Processed via Stripe</p>
                </div>
              </div>
              <Badge type="verified" label="Secure" />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="w-1/3 text-xs" onClick={() => setAddFundsOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="gold"
                className="w-2/3 text-xs font-bold uppercase tracking-wider"
                disabled={isProcessing}
                onClick={handleAddFunds}
              >
                {isProcessing ? "Processing..." : `Top Up $${topupAmount}`}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
