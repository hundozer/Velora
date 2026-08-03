"use client";

import React, { useState } from "react";
import { MOCK_REFERRAL_STATS } from "@/lib/mockData";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Share2,
  Copy,
  CheckCircle2,
  Users,
  Award,
  Crown,
  Sparkles,
  TrendingUp,
  Gift,
  ShieldCheck,
} from "lucide-react";

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);
  const stats = MOCK_REFERRAL_STATS;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(stats.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-velora-gold/20 text-velora-gold border border-velora-gold/40 flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5" /> VELORA VIP GROWTH ENGINE
            </span>
            <span className="text-xs text-amber-300 font-mono uppercase tracking-widest">• Member Referrals & Ambassadors</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-velora-textPrimary flex items-center gap-3">
            <Award className="w-8 h-8 text-velora-gold" />
            Referral Program & Ambassador Desk
          </h1>
          <p className="text-xs text-velora-textSecondary max-w-2xl leading-relaxed">
            Invite trusted friends to join Velora's high-discretion community. Earn complementary VIP membership days, profile visibility boosts, and ambassador standing.
          </p>
        </div>
      </div>

      {/* Unique Link Card */}
      <Card variant="goldBorder" className="p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-serif font-bold text-velora-textPrimary flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-velora-gold" />
              Your Exclusive Referral Invitation Link
            </h2>
            <p className="text-xs text-velora-textMuted mt-0.5">
              Each invited member receives priority Level 2 verification review upon signup.
            </p>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
            Active Status: Ambassador
          </span>
        </div>

        <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2.5 rounded-2xl">
          <input
            type="text"
            readOnly
            value={stats.referralLink}
            className="flex-1 bg-transparent text-xs font-mono text-velora-gold px-3 focus:outline-none"
          />
          <Button
            variant="gold"
            size="sm"
            className="text-xs font-bold uppercase tracking-wider gap-2 shadow-gold-glow shrink-0"
            onClick={handleCopyLink}
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-velora-bg" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy Link"}
          </Button>
        </div>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="glass" className="p-6 space-y-2">
          <span className="text-xs font-semibold text-velora-textMuted uppercase tracking-wider block">
            Invitation Clicks
          </span>
          <span className="text-3xl font-serif font-bold text-velora-textPrimary">{stats.clicksCount}</span>
          <span className="text-[11px] text-velora-textMuted font-mono">Total Link Views</span>
        </Card>

        <Card variant="glass" className="p-6 space-y-2">
          <span className="text-xs font-semibold text-velora-textMuted uppercase tracking-wider block">
            Registrations
          </span>
          <span className="text-3xl font-serif font-bold text-amber-300">{stats.registrationsCount}</span>
          <span className="text-[11px] text-emerald-400 font-mono">Verified Signups</span>
        </Card>

        <Card variant="glass" className="p-6 space-y-2">
          <span className="text-xs font-semibold text-velora-textMuted uppercase tracking-wider block">
            Conversions
          </span>
          <span className="text-3xl font-serif font-bold text-purple-300">{stats.conversionsCount}</span>
          <span className="text-[11px] text-velora-textMuted font-mono">VIP Conversions</span>
        </Card>

        <Card variant="goldBorder" className="p-6 space-y-2">
          <span className="text-xs font-semibold text-velora-gold uppercase tracking-wider block">
            Rewards Earned
          </span>
          <span className="text-3xl font-serif font-bold text-velora-gold">+{stats.rewardsEarnedDays} Days</span>
          <span className="text-[11px] text-velora-gold font-mono">VIP Premium Access</span>
        </Card>
      </div>

      {/* Ambassador Program Overview */}
      <Card variant="glass" className="p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Crown className="w-8 h-8 text-amber-400" />
          <div>
            <h2 className="text-xl font-serif font-bold text-velora-textPrimary">Velora Ambassador Program</h2>
            <p className="text-xs text-velora-textMuted mt-0.5">
              Host private city gatherings, organize communities, and represent Velora in luxury hubs across Europe.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/10">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-velora-gold uppercase tracking-wider flex items-center gap-1.5">
              <Gift className="w-4 h-4" /> 1. Reward Days & Boosts
            </h4>
            <p className="text-xs text-velora-textSecondary leading-relaxed">
              Earn 15 days of VIP Membership and profile discovery boosts for every verified member who joins via your link.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4" /> 2. Community Host Rights
            </h4>
            <p className="text-xs text-velora-textSecondary leading-relaxed">
              Ambassadors can create and moderate official city hubs and ticketed private salons.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> 3. Verified Badge Status
            </h4>
            <p className="text-xs text-velora-textSecondary leading-relaxed">
              Receive the prestigious <span className="font-bold text-amber-300">Velora Ambassador</span> badge on your profile and event listings.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
