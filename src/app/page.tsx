"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MOCK_PROFILES, MOCK_LIVE_STREAMS } from "@/lib/mockData";
import {
  Sparkles,
  ShieldCheck,
  Compass,
  Radio,
  Lock,
  ArrowRight,
  Heart,
  Users,
  Eye,
  CheckCircle2,
  Crown,
  Flame,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="space-y-16 pb-16 text-left">
      {/* HERO SECTION: PRIVATE MEMBERS CLUB AFTER DARK */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden border-b border-white/10">
        {/* Background Image Overlay with Cinematic Dark Gradients */}
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=2000&q=80"
            alt="Private Members Lounge"
            className="w-full h-full object-cover opacity-25 scale-105 filter contrast-125 saturate-150"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-velora-bg via-velora-bg/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-velora-bg via-transparent to-velora-bg" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center space-y-8 py-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-velora-gold/40 text-velora-gold text-xs font-semibold uppercase tracking-widest backdrop-blur-md shadow-gold-glow">
            <Sparkles className="w-3.5 h-3.5 text-velora-gold animate-pulse" />
            <span>Private Members Club After Dark</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-velora-textPrimary leading-tight">
              Meet people who want <br className="hidden sm:inline" />
              <span className="text-gold-gradient italic">the same things.</span>
            </h1>

            <p className="text-base sm:text-lg text-velora-textSecondary max-w-2xl mx-auto leading-relaxed">
              Your private world of adult connections. Real people. Real chemistry. Real experiences. Join an open-minded community of verified adults.
            </p>
          </div>

          {/* Primary & Secondary CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button
                variant="gold"
                size="lg"
                className="w-full sm:w-auto text-sm font-bold uppercase tracking-wider px-8 py-4 shadow-gold-glow flex items-center justify-center gap-2"
              >
                <span>Enter Velora</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link href="/discovery" className="w-full sm:w-auto">
              <Button
                variant="glass"
                size="lg"
                className="w-full sm:w-auto text-sm font-semibold uppercase tracking-wider px-8 py-4 border-white/20 hover:border-velora-gold/50"
              >
                Explore Private Club
              </Button>
            </Link>
          </div>

          {/* Seductive Stats Counter Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto pt-10 border-t border-white/10 text-center">
            <div>
              <span className="text-2xl font-serif font-bold text-velora-gold block">100%</span>
              <span className="text-[11px] text-velora-textMuted uppercase font-mono tracking-wider">Verified Adults</span>
            </div>
            <div>
              <span className="text-2xl font-serif font-bold text-velora-textPrimary block">12,400+</span>
              <span className="text-[11px] text-velora-textMuted uppercase font-mono tracking-wider">Active Members</span>
            </div>
            <div>
              <span className="text-2xl font-serif font-bold text-amber-300 block">450+</span>
              <span className="text-[11px] text-velora-textMuted uppercase font-mono tracking-wider">Private Salons</span>
            </div>
            <div>
              <span className="text-2xl font-serif font-bold text-rose-400 block">End-to-End</span>
              <span className="text-[11px] text-velora-textMuted uppercase font-mono tracking-wider">Discreet Privacy</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: DISCOVER PEOPLE NEARBY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-velora-gold">
              Open-Minded & Confident Connections
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-velora-textPrimary mt-1">
              Discover People Nearby
            </h2>
          </div>

          <Link href="/discovery">
            <Button variant="ghost" size="sm" className="text-xs font-bold text-velora-gold gap-1">
              <span>View All Members</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Profile Invitation Preview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {MOCK_PROFILES.map((profile) => (
            <Card key={profile.id} variant="goldBorder" hoverEffect className="p-0 overflow-hidden text-left group">
              <div className="h-80 w-full bg-velora-card relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-velora-bg via-velora-bg/30 to-transparent" />

                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-black/70 text-velora-gold border border-velora-gold/40 backdrop-blur-md flex items-center gap-1 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Level {profile.verificationLevel?.slice(-1) || "3"} Verified
                  </span>
                  {profile.isOnline && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Online
                    </span>
                  )}
                </div>

                <div className="absolute bottom-4 left-4 right-4 space-y-1">
                  <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                    {profile.displayName}, {profile.age}
                  </h3>
                  <p className="text-xs text-velora-textSecondary line-clamp-1 font-medium">{profile.headline}</p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.slice(0, 3).map((tag, i) => (
                    <span key={i} className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-velora-textMuted border border-white/10">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-white/10">
                  <span className="text-xs text-velora-gold font-bold">{profile.city}, {profile.country}</span>
                  <Link href={`/profile/${profile.id}`}>
                    <Button variant="gold" size="sm" className="text-xs font-bold uppercase tracking-wider shadow-gold-glow">
                      Enter World
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* SECTION 3: TRUST & SAFETY - OPEN-MINDED DOES NOT MEAN UNSAFE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card variant="glass" className="p-8 sm:p-12 text-left relative overflow-hidden border-velora-gold/30">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono uppercase tracking-wider">
                High-Discretion Trust Architecture
              </span>

              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-velora-textPrimary">
                "Open-minded does not mean unsafe."
              </h2>

              <p className="text-xs sm:text-sm text-velora-textSecondary leading-relaxed">
                Velora enforces 4-Tier Biometric Verification, encrypted messaging, granular location precision controls, and zero tolerance for harassment. Connect with total confidence and peace of mind.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2 text-xs text-velora-textPrimary font-semibold">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Level 3 Biometric ID Check</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Encrypted Disappearing Media</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Stealth & Incognito Mode</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>24/7 Human Moderation</span>
                </div>
              </div>
            </div>

            <div className="glass-panel-gold p-6 rounded-3xl border border-velora-gold/40 space-y-4 text-center">
              <ShieldCheck className="w-12 h-12 text-velora-gold mx-auto" />
              <h3 className="text-lg font-serif font-bold text-velora-textPrimary">
                Ready to explore private adult connections?
              </h3>
              <p className="text-xs text-velora-textMuted leading-relaxed">
                Create your private identity in less than 2 minutes.
              </p>
              <Link href="/register" className="block">
                <Button variant="gold" size="lg" className="w-full text-xs font-bold uppercase tracking-wider shadow-gold-glow">
                  Enter Velora Now
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
