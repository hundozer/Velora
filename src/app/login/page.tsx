"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, ArrowRight, ShieldCheck, UserPlus } from "lucide-react";

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.07]"
          style={{
            background: "radial-gradient(circle, #D4AF37 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.05]"
          style={{
            background: "radial-gradient(circle, #7C3AED 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.03]"
          style={{
            background: "radial-gradient(circle, #D4AF37 0%, transparent 60%)",
          }}
        />
      </div>

      {/* Main Content Card */}
      <div
        className={`relative z-10 w-full max-w-[440px] mx-auto px-5 py-16 transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        {/* Intimo Brand Identity */}
        <div className="text-center mb-10 space-y-4">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute w-20 h-20 rounded-full bg-velora-gold/10 animate-pulse" />
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-velora-gold via-velora-amber to-velora-goldHover p-[2px] shadow-gold-glow">
              <div className="w-full h-full bg-velora-bg rounded-full flex items-center justify-center">
                <span className="font-serif font-bold text-[28px] gold-gradient-text select-none">
                  I
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-[32px] font-serif font-bold tracking-tight text-velora-textPrimary leading-none">
              Welcome to Intimo
            </h1>
            <p className="text-sm text-velora-textMuted font-light">
              Private Members Club After Dark • Powered by Intimo
            </p>
          </div>
        </div>

        {/* Primary Auth0 Sign In Box */}
        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl shadow-2xl space-y-6">
          <a
            href="/api/auth/login"
            className="group relative block w-full overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-velora-gold via-velora-amber to-velora-gold opacity-100" />
            <div className="relative m-[2px] rounded-[14px] bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 py-4 px-6 flex items-center justify-center gap-3 shadow-gold-glow">
              <Lock className="w-[18px] h-[18px] text-velora-bg" />
              <span className="text-velora-bg font-bold text-sm uppercase tracking-[0.15em]">
                Sign In with Auth0
              </span>
              <ArrowRight className="w-4 h-4 text-velora-bg transition-transform group-hover:translate-x-1" />
            </div>
          </a>

          <a
            href="/api/auth/login?screen_hint=signup"
            className="group relative block w-full overflow-hidden rounded-2xl transition-all duration-300 border border-white/10 hover:border-velora-gold/40 hover:bg-white/[0.04]"
          >
            <div className="py-3.5 px-6 flex items-center justify-center gap-2 text-velora-textPrimary font-semibold text-xs uppercase tracking-widest">
              <UserPlus className="w-4 h-4 text-velora-gold" />
              <span>Create Intimo Account</span>
            </div>
          </a>

          <div className="pt-2 border-t border-white/[0.06] text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-velora-textMuted">
              <ShieldCheck className="w-3.5 h-3.5 text-velora-gold/60" />
              <span className="text-[11px] tracking-wide">
                Secure Identity • Passwordless • Social Logins
              </span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center space-y-3">
          <div className="flex items-center justify-center gap-1.5 text-velora-textMuted/50">
            <Lock className="w-3 h-3" />
            <span className="text-[10px] tracking-wide">
              256-bit encryption • GDPR compliant
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
