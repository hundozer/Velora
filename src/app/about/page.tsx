"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, Lock, ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 text-left">
      <div className="text-center space-y-4">
        <Badge type="verified" label="Intimo Social Philosophy" />
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-velora-textPrimary">
          A Community Built for <br />
          <span className="gold-gradient-text">Adult Social Discovery</span>
        </h1>
        <p className="text-sm text-velora-textSecondary max-w-2xl mx-auto leading-relaxed">
          Intimo is a free adults-only social community for discovering people, public media, and dating classifieds. Members choose what they share and who can interact with them.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card variant="goldBorder" className="p-8 space-y-4">
          <ShieldCheck className="w-8 h-8 text-velora-gold" />
          <h2 className="text-2xl font-serif font-bold text-velora-textPrimary">
            Authenticity & Verification
          </h2>
          <p className="text-xs text-velora-textSecondary leading-relaxed">
            Adult eligibility, contact verification, and stronger identity checks are separate controls. Badges reflect completed backend verification, while reporting and moderation address suspected minors, impersonation, and abuse.
          </p>
        </Card>

        <Card variant="glass" className="p-8 space-y-4">
          <Lock className="w-8 h-8 text-emerald-400" />
          <h2 className="text-2xl font-serif font-bold text-velora-textPrimary">
            Discretion & Stealth Controls
          </h2>
          <p className="text-xs text-velora-textSecondary leading-relaxed">
            Your privacy is our standard. Use city-level location, visibility controls, message permissions, blocking, reporting, consent management, and data-rights tools.
          </p>
        </Card>
      </div>

      <div className="text-center pt-8">
        <Link href="/register">
          <Button variant="gold" size="lg" className="font-bold uppercase tracking-wider gap-2">
            Join Intimo Free
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
