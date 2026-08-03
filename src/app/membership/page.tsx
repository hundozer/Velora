"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CheckoutModal } from "@/components/payment/CheckoutModal";
import {
  Crown,
  Sparkles,
  CheckCircle2,
  Zap,
  ShieldCheck,
  EyeOff,
  Filter,
  MessageSquare,
  Star,
  Flame,
} from "lucide-react";

export default function MembershipPage() {
  const [selectedTier, setSelectedTier] = useState<{ title: string; price: number } | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const handleSelectTier = (title: string, price: number) => {
    if (price === 0) return;
    setSelectedTier({ title, price });
    setCheckoutOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-left">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-velora-gold/20 text-velora-gold border border-velora-gold/40 uppercase tracking-widest inline-flex items-center gap-1.5 shadow-gold-glow">
          <Crown className="w-3.5 h-3.5" /> EXCLUSIVE VELORA MEMBERSHIP
        </span>
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-velora-textPrimary">
          Elevate Your Private Connections
        </h1>
        <p className="text-xs sm:text-sm text-velora-textSecondary leading-relaxed">
          Unlock stealth privacy controls, priority discovery placement, unlimited encrypted messaging, and exclusive salon event access.
        </p>
      </div>

      {/* Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* FREE TIER: DISCOVER VELORA */}
        <Card variant="glass" className="p-8 space-y-6 flex flex-col justify-between text-left">
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-xl font-serif font-bold text-velora-textPrimary">Discover Velora</h3>
              <p className="text-xs text-velora-textMuted">Standard verified member access</p>
            </div>
            <div className="text-3xl font-serif font-bold text-velora-textPrimary">$0 <span className="text-xs font-sans text-velora-textMuted">/ month</span></div>

            <ul className="space-y-3 pt-4 border-t border-white/10 text-xs text-velora-textSecondary">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Profile Persona & Identity Creation</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>5 Direct Messages per Day</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Standard Location Discovery</span>
              </li>
            </ul>
          </div>

          <Button variant="ghost" disabled className="w-full text-xs font-bold uppercase tracking-wider">
            Current Access
          </Button>
        </Card>

        {/* PREMIUM TIER: UNLOCK DEEPER CONNECTIONS */}
        <Card variant="goldBorder" className="p-8 space-y-6 flex flex-col justify-between text-left relative bg-gold-card">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full text-[10px] font-bold bg-gold-gradient text-velora-bg shadow-gold-glow uppercase tracking-wider">
            Most Popular
          </span>

          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-xl font-serif font-bold text-velora-textPrimary flex items-center gap-2">
                Unlock Deeper Connections
                <Sparkles className="w-4 h-4 text-velora-gold" />
              </h3>
              <p className="text-xs text-velora-textMuted">Enhanced privacy & discovery boost</p>
            </div>
            <div className="text-3xl font-serif font-bold text-velora-gold">$29.99 <span className="text-xs font-sans text-velora-textMuted">/ month</span></div>

            <ul className="space-y-3 pt-4 border-t border-white/10 text-xs text-velora-textPrimary font-semibold">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-velora-gold shrink-0" />
                <span>Unlimited Encrypted Messages</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-velora-gold shrink-0" />
                <span>Advanced Preferences & Filtering</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-velora-gold shrink-0" />
                <span>Stealth Mode & Incognito Browsing</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-velora-gold shrink-0" />
                <span>2x Discovery Placement Boost</span>
              </li>
            </ul>
          </div>

          <Button
            variant="gold"
            className="w-full text-xs font-bold uppercase tracking-wider py-3 shadow-gold-glow"
            onClick={() => handleSelectTier("Premium Tier Upgrade", 29.99)}
          >
            Unlock Deeper Connections
          </Button>
        </Card>

        {/* VIP TIER: INNER CIRCLE */}
        <Card variant="glass" className="p-8 space-y-6 flex flex-col justify-between text-left relative border-amber-500/50">
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-xl font-serif font-bold text-amber-300 flex items-center gap-2">
                The Inner Circle
                <Crown className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-xs text-velora-textMuted">Maximum priority & exclusive access</p>
            </div>
            <div className="text-3xl font-serif font-bold text-amber-300">$79.99 <span className="text-xs font-sans text-velora-textMuted">/ month</span></div>

            <ul className="space-y-3 pt-4 border-t border-white/10 text-xs text-velora-textSecondary">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-semibold text-velora-textPrimary">Priority Discovery Ranking Placement</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Access to Private VIP Communities</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Complimentary Salon Event Entry</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Custom Gold Profile Insignia</span>
              </li>
            </ul>
          </div>

          <Button
            variant="glass"
            className="w-full text-xs font-bold uppercase tracking-wider border-amber-500/40 text-amber-300 hover:bg-amber-500/20 py-3"
            onClick={() => handleSelectTier("Inner Circle VIP Membership", 79.99)}
          >
            Become Part of the Inner Circle
          </Button>
        </Card>
      </div>

      {/* Checkout Modal */}
      {selectedTier && (
        <CheckoutModal
          isOpen={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          productTitle={selectedTier.title}
          creatorName="Velora Platform"
          grossAmount={selectedTier.price}
          type="MEMBERSHIP_UPGRADE"
        />
      )}
    </div>
  );
}
