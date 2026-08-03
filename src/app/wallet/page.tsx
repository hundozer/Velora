"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Wallet, DollarSign, Lock, CreditCard } from "lucide-react";

export default function WalletPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      <div className="flex items-center gap-3">
        <Wallet className="w-7 h-7 text-emerald-400" />
        <div>
          <h1 className="text-3xl font-serif font-bold text-velora-textPrimary">
            Wallet & Discretion Credits
          </h1>
          <p className="text-xs text-velora-textSecondary mt-1">
            Manage your discreet token balance for private album unlocks and creator subscriptions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="goldBorder" className="p-8 space-y-4 md:col-span-2">
          <span className="text-xs font-bold uppercase tracking-wider text-velora-textMuted block font-serif">
            Available Credit Balance
          </span>
          <span className="text-4xl font-serif font-bold gold-gradient-text">250.00 Credits</span>
          <p className="text-xs text-velora-textSecondary">
            1 Credit = $1.00 USD. Credits allow anonymous, instant media unlocks without individual line-item bank charges.
          </p>
          <div className="pt-2 flex gap-3">
            <Button variant="gold" size="sm" className="font-bold uppercase tracking-wider">
              Add Credits
            </Button>
            <Button variant="glass" size="sm" className="text-xs">
              View Receipt History
            </Button>
          </div>
        </Card>

        <Card variant="glass" className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-serif font-bold text-velora-textPrimary">Discreet Billing</h3>
          </div>
          <p className="text-xs text-velora-textMuted leading-relaxed">
            All credit top-ups appear on credit card statements under generic corporate descriptors for complete anonymity.
          </p>
        </Card>
      </div>
    </div>
  );
}
