"use client";

import React, { useEffect } from "react";
import { Sparkles, ArrowRight, ShieldCheck, Lock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  useEffect(() => {
    // Automatically redirect to Auth0 Registration
    const timer = setTimeout(() => {
      window.location.href = "/auth/login?screen_hint=signup";
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 text-left">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-velora-gold/20 text-velora-gold border border-velora-gold/40 uppercase tracking-widest inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> PRIVATE MEMBERS CLUB
          </span>
          <h1 className="text-3xl font-serif font-bold text-velora-textPrimary">Join Intimo</h1>
          <p className="text-xs text-velora-textSecondary leading-relaxed">
            Connecting to Auth0 Secure Registration...
          </p>
        </div>

        <Card variant="goldBorder" className="p-8 space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-gold-gradient p-[1px] mx-auto shadow-gold-glow">
            <div className="w-full h-full bg-velora-bg rounded-full flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-velora-gold animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-serif font-bold text-velora-textPrimary">
              Redirecting to Secure Sign Up
            </h2>
            <p className="text-xs text-velora-textMuted leading-relaxed">
              If your browser does not redirect automatically within a second, click below.
            </p>
          </div>

          <a
            href="/auth/login?screen_hint=signup"
            className="block w-full"
          >
            <Button variant="gold" size="lg" className="w-full text-xs font-bold uppercase tracking-wider shadow-gold-glow flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" />
              <span>Continue to Auth0 Registration</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </a>
        </Card>
      </div>
    </div>
  );
}
