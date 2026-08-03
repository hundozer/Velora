"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, Lock, CheckCircle2, FileCheck, EyeOff } from "lucide-react";

export default function SafetyPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10 text-left">
      <div className="text-center space-y-4">
        <Badge type="verified" label="Safety & Discretion Policy" />
        <h1 className="text-4xl font-serif font-bold text-velora-textPrimary">
          Safety, Consent & Compliance
        </h1>
        <p className="text-xs text-velora-textSecondary max-w-xl mx-auto">
          Our commitment to legal compliance, 18+ age verification, consent standards, and data protection.
        </p>
      </div>

      <div className="space-y-6">
        <Card variant="glass" className="p-8 space-y-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-velora-gold" />
            <h2 className="text-xl font-serif font-bold text-velora-textPrimary">1. Strict 18+ Verification (2257 Compliance)</h2>
          </div>
          <p className="text-xs text-velora-textSecondary leading-relaxed">
            All users, creators, and media participants on Velora undergo strict age and identity verification prior to uploading content or sending messages. Records are securely stored in accordance with international 18+ compliance regulations.
          </p>
        </Card>

        <Card variant="glass" className="p-8 space-y-4">
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-serif font-bold text-velora-textPrimary">2. Mutual Consent & Non-Disclosure</h2>
          </div>
          <p className="text-xs text-velora-textSecondary leading-relaxed">
            All interactions on Velora require mutual consent. Sharing private media or messaging details outside the platform without explicit consent is illegal and results in immediate account termination, IP ban, and reporting to legal authorities.
          </p>
        </Card>

        <Card variant="glass" className="p-8 space-y-4">
          <div className="flex items-center gap-3">
            <EyeOff className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-serif font-bold text-velora-textPrimary">3. Discreet Billing & Stealth</h2>
          </div>
          <p className="text-xs text-velora-textSecondary leading-relaxed">
            All financial transactions use non-descript billing descriptors on credit card and bank statements to protect user privacy.
          </p>
        </Card>
      </div>
    </div>
  );
}
