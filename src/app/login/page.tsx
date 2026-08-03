"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/LanguageContext";
import { UserRole } from "@/types";
import {
  Sparkles,
  Lock,
  ArrowRight,
  ShieldCheck,
  User,
  Users,
  Crown,
  KeyRound,
  CheckCircle2,
} from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useTranslation();

  const handleQuickDemoLogin = (demoRole: UserRole, demoEmail: string) => {
    login(demoEmail, demoRole);
    window.location.href = "/discovery";
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 text-left">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-gold-gradient p-[1px] shadow-gold-glow flex items-center justify-center mx-auto mb-3">
            <div className="w-full h-full bg-velora-bg rounded-full flex items-center justify-center">
              <span className="font-serif font-bold text-2xl text-velora-gold">V</span>
            </div>
          </div>

          <h1 className="text-3xl font-serif font-bold text-velora-textPrimary">
            Enter Velora
          </h1>
          <p className="text-xs text-velora-textSecondary leading-relaxed">
            Private Members Club After Dark • Powered by Enterprise Auth0
          </p>
        </div>

        {/* Unified Auth0 Authentication Card */}
        <Card variant="goldBorder" className="p-8 space-y-6 bg-gold-card">
          <div className="space-y-4 text-center">
            <a
              href="/api/auth/login"
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-velora-bg font-bold text-xs uppercase tracking-widest shadow-gold-glow flex items-center justify-center gap-3 hover:scale-[1.02] transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>Sign In with Auth0</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <div className="p-3 glass-panel rounded-2xl border border-white/10 text-left text-xs space-y-1.5 font-mono">
              <span className="text-velora-gold font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Auth0 Identity Provider
              </span>
              <p className="text-[11px] text-velora-textMuted leading-relaxed">
                Auth0 manages passwords, email verification, and social sign-in. Backend authorization & permissions are handled by Velora.
              </p>
            </div>
          </div>

          {/* Quick Demo Preview Logins */}
          <div className="border-t border-white/10 pt-5 space-y-3">
            <span className="text-[10px] uppercase font-bold text-velora-textMuted font-mono block text-center tracking-wider">
              Preview Mode: 1-Click Role Logins
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("MEMBER", "single.member@velora.club")}
                className="p-3 rounded-2xl glass-panel border border-white/10 text-xs font-bold text-velora-textSecondary hover:text-velora-gold hover:border-velora-gold/40 text-left flex items-center gap-2 transition-all"
              >
                <User className="w-4 h-4 text-velora-gold" />
                <div>
                  <span className="block text-white">Single Member</span>
                  <span className="text-[10px] text-velora-textMuted font-mono font-normal">Elena Vance</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin("COUPLE", "couple.berlin@velora.club")}
                className="p-3 rounded-2xl glass-panel border border-white/10 text-xs font-bold text-velora-textSecondary hover:text-amber-300 hover:border-amber-400/40 text-left flex items-center gap-2 transition-all"
              >
                <Users className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="block text-white">Couple Profile</span>
                  <span className="text-[10px] text-velora-textMuted font-mono font-normal">Marcus & Sarah</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin("CREATOR", "creator.valerie@velora.club")}
                className="p-3 rounded-2xl glass-panel border border-white/10 text-xs font-bold text-velora-textSecondary hover:text-purple-300 hover:border-purple-400/40 text-left flex items-center gap-2 transition-all"
              >
                <Crown className="w-4 h-4 text-purple-400" />
                <div>
                  <span className="block text-white">Verified Creator</span>
                  <span className="text-[10px] text-velora-textMuted font-mono font-normal">Valerie Night</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin("ADMIN", "admin@velora.club")}
                className="p-3 rounded-2xl glass-panel border border-white/10 text-xs font-bold text-velora-textSecondary hover:text-emerald-300 hover:border-emerald-400/40 text-left flex items-center gap-2 transition-all"
              >
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="block text-white">System Admin</span>
                  <span className="text-[10px] text-velora-textMuted font-mono font-normal">Super Admin</span>
                </div>
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
