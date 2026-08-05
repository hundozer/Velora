"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MOCK_PROFILES } from "@/lib/mockData";
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
  UserCheck,
} from "lucide-react";

import { useTranslation } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  if (user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-3">
        <Sparkles className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-xs font-mono text-amber-300 font-bold uppercase tracking-wider">
          Redirecting to your Intimo live feed...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-16 text-left">
      {/* HERO SECTION: ADULT-ONLY SOCIAL DISCOVERY */}
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
            <span>{t("hero.tag")}</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-velora-textPrimary leading-tight">
              {t("hero.headline")}
            </h1>

            <p className="text-base sm:text-lg text-velora-textSecondary max-w-2xl mx-auto leading-relaxed">
              {t("hero.subhead")}
            </p>
          </div>

          {/* Primary & Secondary CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a href="/api/auth/login?screen_hint=signup" className="w-full sm:w-auto">
              <Button
                variant="gold"
                size="lg"
                className="w-full sm:w-auto text-sm font-bold uppercase tracking-wider px-8 py-4 shadow-gold-glow flex items-center justify-center gap-2"
              >
                <span>{t("hero.join_cta")}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </a>

            <Link href="/discovery" className="w-full sm:w-auto">
              <Button
                variant="glass"
                size="lg"
                className="w-full sm:w-auto text-sm font-semibold uppercase tracking-wider px-8 py-4 border-white/20 hover:border-velora-gold/50"
              >
                {t("hero.explore_cta")}
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
              <span className="text-[11px] text-velora-textMuted uppercase font-mono tracking-wider">High-Discretion Privacy</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5 SHOWCASE SECTIONS */}
      {/* 1. VERIFIED ADULTS & NEARBY CONNECTIONS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-velora-gold">
              Fictional Demo Accounts • Verified Adult Profiles
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

        {/* Profile Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {MOCK_PROFILES.map((profile) => (
            <Card key={profile.id} variant="goldBorder" hoverEffect className="p-0 overflow-hidden text-left group bg-gold-card">
              <div className="h-72 w-full bg-velora-card relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter saturate-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-velora-bg via-velora-bg/30 to-transparent" />

                <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-black/80 text-velora-gold border border-velora-gold/40 font-mono uppercase">
                    Level 3 Verified
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-left">
                  <h3 className="text-lg font-serif font-bold text-white flex items-center gap-1.5">
                    {profile.displayName}, {profile.age}
                  </h3>
                  <p className="text-[11px] text-velora-gold font-medium">{profile.city}</p>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <p className="text-xs text-velora-textSecondary line-clamp-2 leading-relaxed">
                  "{profile.headline}"
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-white/10">
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">Online Now</span>
                  <Link href={`/profile/${profile.id}`}>
                    <Button variant="gold" size="sm" className="text-[10px] font-bold uppercase tracking-wider shadow-gold-glow py-1 px-3">
                      View Profile
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 2 & 3. PRIVATE PROFILES & EXCLUSIVE CREATORS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card variant="glass" className="p-8 text-left space-y-4 border-velora-gold/30">
            <Lock className="w-8 h-8 text-velora-gold" />
            <h3 className="text-2xl font-serif font-bold text-velora-textPrimary">Private Profiles & Media Vaults</h3>
            <p className="text-xs text-velora-textSecondary leading-relaxed">
              Control who views your photos, location precision, and activity status. Request private vault keys directly from verified members.
            </p>
            <Link href="/discovery">
              <Button variant="gold" size="sm" className="text-xs font-bold uppercase tracking-wider">
                Explore Private Profiles
              </Button>
            </Link>
          </Card>

          <Card variant="glass" className="p-8 text-left space-y-4 border-amber-500/30">
            <Crown className="w-8 h-8 text-amber-400" />
            <h3 className="text-2xl font-serif font-bold text-velora-textPrimary">Exclusive Creators & Salons</h3>
            <p className="text-xs text-velora-textSecondary leading-relaxed">
              Subscribe to verified creators, view 4K digital art journals, and unlock private photo and video vaults.
            </p>
            <Link href="/creators">
              <Button variant="glass" size="sm" className="text-xs font-bold uppercase tracking-wider border-amber-500/40 text-amber-300">
                Explore Creator Salons
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* LIVE STREAMING & PRIVATE BROADCAST SALONS - COMING SOON BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card variant="goldBorder" className="p-8 sm:p-10 text-left bg-gradient-to-r from-velora-bg via-velora-card to-velora-bg border-amber-500/40 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold font-mono uppercase tracking-widest">
                <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Feature Spotlight • Coming Soon</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-velora-textPrimary">
                Live Broadcasts & Private Video Salons
              </h2>
              <p className="text-xs text-velora-textSecondary leading-relaxed">
                We are currently building ultra-private, encrypted WebRTC live broadcast rooms where creators and verified members can host live interactive experiences.
              </p>
            </div>

            <div className="shrink-0 p-4 rounded-2xl glass-panel text-center border border-amber-500/30">
              <span className="text-xs font-mono font-bold text-velora-gold uppercase tracking-wider block mb-1">
                Phase 2 Launch
              </span>
              <span className="text-[10px] text-velora-textMuted font-mono">WebRTC Encrypted Rooms</span>
            </div>
          </div>
        </Card>
      </section>

      {/* TRUST BANNER: OPEN-MINDED DOES NOT MEAN UNSAFE */}
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
                Intimo enforces Level 3 Biometric Verification, encrypted messaging, granular location precision controls, and zero tolerance for harassment.
              </p>
            </div>

            <div className="glass-panel-gold p-6 rounded-3xl border border-velora-gold/40 space-y-4 text-center">
              <ShieldCheck className="w-12 h-12 text-velora-gold mx-auto" />
              <h3 className="text-lg font-serif font-bold text-velora-textPrimary">
                Ready to explore private adult connections?
              </h3>
              <a href="/api/auth/login?screen_hint=signup" className="block">
                <Button variant="gold" size="lg" className="w-full text-xs font-bold uppercase tracking-wider shadow-gold-glow">
                  Join Intimo Now
                </Button>
              </a>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
