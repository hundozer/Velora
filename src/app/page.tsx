"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  ShieldCheck,
  Lock,
  Sparkles,
  Users,
  Compass,
  Crown,
  Heart,
  ArrowRight,
  CheckCircle2,
  Sliders,
  EyeOff,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gold-radial pointer-events-none blur-3xl opacity-60" />

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel-gold mb-8 shadow-gold-glow animate-pulse">
          <Sparkles className="w-4 h-4 text-velora-gold" />
          <span className="text-xs font-bold uppercase tracking-widest text-velora-gold">
            Invitation-Only Adult Social Marketplace
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-bold tracking-tight text-velora-textPrimary max-w-5xl mx-auto leading-tight">
          Where Discretion Meets <br />
          <span className="gold-gradient-text">Uncompromising Luxury</span>
        </h1>

        <p className="mt-8 text-base sm:text-xl text-velora-textSecondary max-w-2xl mx-auto font-light leading-relaxed">
          Velora is a private, verified adult network combining modern social discovery, private creator economies, and high-discretion dating for individuals and couples.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register">
            <Button variant="gold" size="lg" className="w-full sm:w-auto font-bold uppercase tracking-wider gap-2">
              Apply For Membership
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/discovery">
            <Button variant="glass" size="lg" className="w-full sm:w-auto font-medium uppercase tracking-wider gap-2">
              <Compass className="w-4 h-4 text-velora-gold" />
              Explore Marketplace
            </Button>
          </Link>
        </div>

        {/* Core Pillars */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-left max-w-5xl mx-auto">
          <div className="glass-panel p-6 rounded-3xl space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-velora-gold/10 flex items-center justify-center text-velora-gold mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-velora-textPrimary font-serif">100% ID Verified</h3>
            <p className="text-xs text-velora-textMuted leading-relaxed">
              Biometric & document verification ensures authentic, high-caliber members.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-velora-textPrimary font-serif">Bank-Grade Privacy</h3>
            <p className="text-xs text-velora-textMuted leading-relaxed">
              Stealth mode, custom visibility controls, and screenshot protection options.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-velora-textPrimary font-serif">Couples & Singles</h3>
            <p className="text-xs text-velora-textMuted leading-relaxed">
              Native support for dual-partner profiles, shared preferences & joint discovery.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-3xl space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-3">
              <Crown className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-velora-textPrimary font-serif">Creator Economy</h3>
            <p className="text-xs text-velora-textMuted leading-relaxed">
              Monetize premium albums, subscriber tiers, and scheduled private live streams.
            </p>
          </div>
        </div>
      </section>

      {/* Role Architecture Showcase */}
      <section className="py-24 bg-velora-card/60 border-y border-white/10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-velora-textPrimary">
              Tailored Experiences for <br />
              <span className="gold-gradient-text">Every Lifestyle</span>
            </h2>
            <p className="text-sm text-velora-textSecondary">
              Switch seamlessly between distinct user roles designed for total flexibility.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Member */}
            <Card variant="glass" className="p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <Badge type="verified" label="Member Mode" />
                <h3 className="text-2xl font-serif font-bold text-velora-textPrimary">
                  Private Member
                </h3>
                <p className="text-xs text-velora-textSecondary leading-relaxed">
                  Browse compatible verified adults, send encrypted direct messages, save favorite profiles, and purchase exclusive creator content.
                </p>
                <ul className="space-y-2.5 text-xs text-velora-textMuted pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-velora-gold" />
                    Advanced location & age filters
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-velora-gold" />
                    Custom privacy & stealth controls
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-velora-gold" />
                    Private album request unlocks
                  </li>
                </ul>
              </div>
              <Link href="/register?role=MEMBER">
                <Button variant="outline" className="w-full text-xs uppercase tracking-wider">
                  Join as Member
                </Button>
              </Link>
            </Card>

            {/* Couple */}
            <Card variant="goldBorder" className="p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <Badge type="couple" label="Couple Mode" />
                <h3 className="text-2xl font-serif font-bold text-velora-textPrimary">
                  Couple Profile
                </h3>
                <p className="text-xs text-velora-textSecondary leading-relaxed">
                  Crafted specifically for couples looking for like-minded individuals or couples. Displays partner names, ages, and shared preferences.
                </p>
                <ul className="space-y-2.5 text-xs text-velora-textMuted pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    Dual partner verification
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    Shared bio & joint media gallery
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    Filtered discovery for couples
                  </li>
                </ul>
              </div>
              <Link href="/register?role=COUPLE">
                <Button variant="gold" className="w-full text-xs uppercase tracking-wider font-bold">
                  Create Couple Profile
                </Button>
              </Link>
            </Card>

            {/* Creator */}
            <Card variant="glass" className="p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <Badge type="creator" label="Creator Mode" />
                <h3 className="text-2xl font-serif font-bold text-velora-textPrimary">
                  Creator Studio
                </h3>
                <p className="text-xs text-velora-textSecondary leading-relaxed">
                  Turn your private content and live experiences into a high-earning brand with custom subscription tiers and pay-per-view media unlocks.
                </p>
                <ul className="space-y-2.5 text-xs text-velora-textMuted pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    Monthly subscription tiers
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    Scheduled live experience rooms
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    Real-time revenue analytics
                  </li>
                </ul>
              </div>
              <Link href="/register?role=CREATOR">
                <Button variant="outline" className="w-full text-xs uppercase tracking-wider border-amber-500/40 text-amber-300">
                  Activate Creator Mode
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Safety & Discretion Commitment */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-10 sm:p-14 rounded-3xl border border-velora-gold/30 shadow-gold-glow flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="space-y-4 max-w-2xl">
            <Badge type="verified" label="Safety First" />
            <h2 className="text-3xl font-serif font-bold text-velora-textPrimary">
              Uncompromising Safety & Discreet Protection
            </h2>
            <p className="text-xs text-velora-textSecondary leading-relaxed">
              Velora strictly enforces 18+ age verification, consent standards, automated screenshot prevention, and discreet bank statements. Non-consensual activity or unverified profiles are strictly prohibited.
            </p>
            <div className="flex items-center gap-6 pt-2">
              <Link href="/safety" className="text-xs font-bold uppercase tracking-wider text-velora-gold hover:underline flex items-center gap-1">
                Read Safety & Moderation Policy
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="w-full lg:w-auto flex flex-col gap-3 min-w-[280px]">
            <div className="p-4 glass-panel rounded-2xl flex items-center gap-3">
              <EyeOff className="w-6 h-6 text-velora-gold" />
              <div>
                <p className="text-xs font-bold text-velora-textPrimary">Anonymous Billing</p>
                <p className="text-[11px] text-velora-textMuted">Discreet descriptor on statements</p>
              </div>
            </div>
            <div className="p-4 glass-panel rounded-2xl flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <div>
                <p className="text-xs font-bold text-velora-textPrimary">Zero Tolerated Spam</p>
                <p className="text-[11px] text-velora-textMuted">AI & human moderation queue</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
