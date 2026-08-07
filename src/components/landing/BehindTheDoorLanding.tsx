"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Sparkles,
  ShieldCheck,
  Lock,
  ArrowRight,
  Heart,
  Users,
  MessageSquare,
  Flame,
  UserCheck,
  Eye,
  Camera,
  Globe,
  Key,
} from "lucide-react";

export function BehindTheDoorLanding() {
  return (
    <div className="space-y-16 pb-20 text-left">
      {/* HERO BANNER: INTIMO PRIVATE SOCIAL CLUB */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden border-b border-white/10">
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=2000&q=80"
            alt="Private Lounge"
            className="w-full h-full object-cover opacity-20 filter contrast-125 saturate-150"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-velora-bg via-velora-bg/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-velora-bg via-transparent to-velora-bg" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center space-y-8 py-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/40 text-amber-300 text-xs font-semibold uppercase tracking-widest backdrop-blur-md shadow-gold-glow">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Exclusive European Adult Social Lounge</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-white leading-tight">
              A Private Sanctuary for <span className="gold-gradient-text">Adult Encounters</span>
            </h1>

            <p className="text-sm sm:text-base text-velora-textSecondary max-w-2xl mx-auto leading-relaxed">
              Intimo is an invite-only high-discretion platform for verified adults, open-minded couples, and creators across Europe. Behind the door lies a private ecosystem designed for discretion, safety, and genuine chemistry.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 max-w-md mx-auto">
            <Link href="/auth/login?screen_hint=signup" className="w-full sm:w-1/2">
              <Button
                variant="gold"
                size="lg"
                className="w-full text-xs font-bold uppercase tracking-wider py-4 shadow-gold-glow text-black flex items-center justify-center gap-2"
              >
                <span>Join Intimo Free</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link href="/auth/login" className="w-full sm:w-1/2">
              <Button
                variant="glass"
                size="lg"
                className="w-full text-xs font-bold uppercase tracking-wider py-4 border-white/20 hover:border-amber-400/50"
              >
                Member Sign In
              </Button>
            </Link>
          </div>

          {/* Security Counter */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto pt-10 border-t border-white/10 text-center">
            <div>
              <span className="text-2xl font-serif font-bold text-amber-300 block">100%</span>
              <span className="text-[11px] text-velora-textMuted uppercase font-mono tracking-wider">Verified Members</span>
            </div>
            <div>
              <span className="text-2xl font-serif font-bold text-white block">10</span>
              <span className="text-[11px] text-velora-textMuted uppercase font-mono tracking-wider">Supported Countries</span>
            </div>
            <div>
              <span className="text-2xl font-serif font-bold text-rose-400 block">Encrypted</span>
              <span className="text-[11px] text-velora-textMuted uppercase font-mono tracking-wider">Private Messages</span>
            </div>
            <div>
              <span className="text-2xl font-serif font-bold text-emerald-400 block">Zero</span>
              <span className="text-[11px] text-velora-textMuted uppercase font-mono tracking-wider">Public Search Indexing</span>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT'S BEHIND THE DOOR - 5 KEY PRIVILEGES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase font-mono">
            <Key className="w-3.5 h-3.5 text-amber-400" /> Unlock What's Behind The Door
          </div>
          <h2 className="text-3xl font-serif font-bold text-white">
            What Awaits You Inside Intimo
          </h2>
          <p className="text-xs text-velora-textMuted leading-relaxed">
            Registered website members unlock full access to European social discovery, active dating notices, live topic chatrooms, and verified adult content.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Verified Adult Profiles */}
          <Card variant="goldBorder" className="p-6 space-y-4 bg-gold-card text-left border-amber-400/30">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-white">Verified Member Profiles</h3>
              <p className="text-xs text-velora-textMuted leading-relaxed mt-2">
                Browse photo-verified singles and couples across Hungary, Czech Republic, Austria, Germany, Poland, and more. Filter by intimate desires, grooming, piercings & location.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-mono text-amber-300 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Biometric Handwritten Note Verification
            </div>
          </Card>

          {/* Card 2: Active Dating Ads Feed */}
          <Card variant="goldBorder" className="p-6 space-y-4 bg-gold-card text-left border-amber-400/30">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-white">Active Dating Ads Feed</h3>
              <p className="text-xs text-velora-textMuted leading-relaxed mt-2">
                Post text dating ads with photo attachments. Use gender, age, media and verification reply preferences without paid access tiers.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-mono text-rose-300 font-bold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-400" /> Auto-Expiring Ads & History Reactivation
            </div>
          </Card>

          {/* Card 3: Live Topic Chatrooms */}
          <Card variant="goldBorder" className="p-6 space-y-4 bg-gold-card text-left border-amber-400/30">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-white">5 Live Topic Chatrooms</h3>
              <p className="text-xs text-velora-textMuted leading-relaxed mt-2">
                Join live lounges: <span className="text-amber-300 font-bold">SexPartner Finder, Chatting, BDSM, Wet Dreams, Gay/Lesbi/Bi</span>. View active room members with gender-color-coded nicknames.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-mono text-sky-300 font-bold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-sky-400" /> Gender Filters (♀ Females, ♂ Males, 👫 Couples, ⚧ Trans)
            </div>
          </Card>

          {/* Card 4: Private Media Vaults & Albums */}
          <Card variant="goldBorder" className="p-6 space-y-4 bg-gold-card text-left border-amber-400/30">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-white">High-Resolution Media Vaults</h3>
              <p className="text-xs text-velora-textMuted leading-relaxed mt-2">
                Explore private photo albums, high-definition video collections, and creator content streamed via Cloudflare R2 cloud storage.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-mono text-purple-300 font-bold flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-purple-400" /> Watermarked & Encrypted Media Protection
            </div>
          </Card>

          {/* Card 5: Encrypted Direct Messaging */}
          <Card variant="goldBorder" className="p-6 space-y-4 bg-gold-card text-left border-amber-400/30">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-white">Encrypted 1-on-1 Messages</h3>
              <p className="text-xs text-velora-textMuted leading-relaxed mt-2">
                Connect directly with members and creators through secure private messaging. Share private photos, location invites, and discrete conversations.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-mono text-emerald-300 font-bold flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-emerald-400" /> Discretion First Policy
            </div>
          </Card>

          {/* Card 6: Creator Studio & Monitization */}
          <Card variant="goldBorder" className="p-6 space-y-4 bg-gold-card text-left border-amber-400/30">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-white">Creator Pre-Registration</h3>
              <p className="text-xs text-velora-textMuted leading-relaxed mt-2">
                Create a free creator profile, publish free content, build followers, and participate in communities as durable creator tools become available.
              </p>
            </div>
            <div className="pt-2 text-[11px] font-mono text-amber-300 font-bold flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-amber-400" /> Free Phase 1 Community
            </div>
          </Card>
        </div>
      </section>

      {/* GUARANTEE & DISCRETION STATEMENT */}
      <section className="max-w-5xl mx-auto px-4">
        <Card variant="goldBorder" className="p-8 sm:p-12 space-y-6 text-center bg-gold-card shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400 shadow-gold-glow">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="space-y-3 max-w-2xl mx-auto">
            <h3 className="text-2xl font-serif font-bold text-white">
              Zero Public Visibility. 100% High Discretion.
            </h3>
            <p className="text-xs text-velora-textMuted leading-relaxed">
              We never expose member names, emails, or activity logs to search engines or non-registered visitors. Everything behind the door requires authenticated member status.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link href="/auth/login?screen_hint=signup" className="w-full sm:w-1/2">
              <Button variant="gold" size="lg" className="w-full text-xs font-bold uppercase tracking-wider shadow-gold-glow text-black">
                Register Free Account
              </Button>
            </Link>
            <Link href="/auth/login" className="w-full sm:w-1/2">
              <Button variant="glass" size="lg" className="w-full text-xs font-bold uppercase tracking-wider border-white/20">
                Log In Now
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
