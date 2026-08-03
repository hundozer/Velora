"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, Lock, Sparkles, Heart, Crown, ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 text-left">
      <div className="text-center space-y-4">
        <Badge type="verified" label="Velora Social Philosophy" />
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-velora-textPrimary">
          The Premier Private <br />
          <span className="gold-gradient-text">Adult Social Club</span>
        </h1>
        <p className="text-sm text-velora-textSecondary max-w-2xl mx-auto leading-relaxed">
          Velora was built to redefine adult social networking—replacing outdated classifieds with a sophisticated, discreet, and private ecosystem inspired by modern social luxury.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card variant="goldBorder" className="p-8 space-y-4">
          <ShieldCheck className="w-8 h-8 text-velora-gold" />
          <h2 className="text-2xl font-serif font-bold text-velora-textPrimary">
            Authenticity & Verification
          </h2>
          <p className="text-xs text-velora-textSecondary leading-relaxed">
            Every member of Velora completes 100% biometric and legal ID verification. We maintain a zero-tolerance policy for impersonation, underage access, or spam.
          </p>
        </Card>

        <Card variant="glass" className="p-8 space-y-4">
          <Lock className="w-8 h-8 text-emerald-400" />
          <h2 className="text-2xl font-serif font-bold text-velora-textPrimary">
            Discretion & Stealth Controls
          </h2>
          <p className="text-xs text-velora-textSecondary leading-relaxed">
            Your privacy is our standard. Enjoy custom location fuzzing, stealth online modes, screenshot protection, and discreet financial billing.
          </p>
        </Card>
      </div>

      <div className="text-center pt-8">
        <Link href="/register">
          <Button variant="gold" size="lg" className="font-bold uppercase tracking-wider gap-2">
            Apply for Membership Access
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
