"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/LanguageContext";
import { UserRole } from "@/types";
import { EmailVerificationService } from "@/lib/auth/emailVerification";
import { EmailNotificationService } from "@/lib/notifications/emailService";
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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("MEMBER");
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendNotice, setResendNotice] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNeedsVerification(false);
    setResendNotice(false);

    if (!email.trim()) {
      setError("Please enter your email or username.");
      return;
    }

    const res = login(email, selectedRole);

    if (res && !res.success) {
      setError(res.message || "Email verification required.");
      setNeedsVerification(true);
      return;
    }

    window.location.href = "/discovery";
  };

  const handleResendEmail = () => {
    if (!email) return;
    const pending = EmailVerificationService.resendToken(email);
    if (pending) {
      const originUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      EmailNotificationService.sendVerificationEmail(email, pending.token, originUrl);
      setResendNotice(true);
    }
  };

  const handleQuickDemoLogin = (demoRole: UserRole, demoEmail: string) => {
    login(demoEmail, demoRole);
    window.location.href = "/discovery";
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 text-left">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-gold-gradient p-[1px] shadow-gold-glow flex items-center justify-center mx-auto mb-3">
            <div className="w-full h-full bg-velora-bg rounded-full flex items-center justify-center">
              <span className="font-serif font-bold text-xl text-velora-gold">V</span>
            </div>
          </div>

          <h1 className="text-3xl font-serif font-bold text-velora-textPrimary">
            {t("auth.login")}
          </h1>
          <p className="text-xs text-velora-textSecondary">
            Enter the Private Members Club After Dark
          </p>
        </div>

        {/* Login Form Card */}
        <Card variant="goldBorder" className="p-8 space-y-6 bg-gold-card">
          {/* Auth0 Hosted Universal Login Button */}
          <div className="space-y-2 pb-2 border-b border-white/10">
            <a
              href="/api/auth/login"
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-velora-bg font-bold text-xs uppercase tracking-wider shadow-gold-glow flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>Continue with Auth0 Universal Login</span>
            </a>
            <p className="text-[10px] text-center text-velora-textMuted font-mono">
              Secure enterprise SSO • Passwordless & Social Login
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {error && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 text-xs text-amber-300 space-y-3">
                <p className="font-semibold">{error}</p>
                {needsVerification && (
                  <div className="space-y-2 pt-1 border-t border-amber-500/20">
                    {(() => {
                      const latest = EmailNotificationService.getLatestEmailFor(email);
                      if (latest) {
                        return (
                          <Link href={latest.confirmationLink} className="block">
                            <Button variant="gold" size="sm" className="w-full text-xs font-bold gap-2 shadow-gold-glow">
                              <CheckCircle2 className="w-4 h-4" /> ⚡ Click to Confirm Email & Activate Account
                            </Button>
                          </Link>
                        );
                      }
                      return (
                        <button
                          type="button"
                          onClick={handleResendEmail}
                          className="text-[11px] font-bold text-velora-gold hover:underline font-mono"
                        >
                          Click here to resend confirmation email →
                        </button>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Email / Username Input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-1">
                Email Address or Username
              </label>
              <Input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. elena@velora.club"
                className="text-xs py-3"
              />
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary">
                  Password
                </label>
                <a href="#" className="text-[11px] text-velora-gold hover:underline font-mono">
                  Forgot Password?
                </a>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="text-xs py-3"
              />
            </div>

            {/* Mode / Role Selector */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-[10px] uppercase font-bold text-velora-textMuted font-mono">
                Select Account Mode
              </label>
              <div className="grid grid-cols-4 gap-1.5 p-1 glass-panel rounded-2xl border border-white/10">
                {[
                  { id: "MEMBER", label: "Member" },
                  { id: "COUPLE", label: "Couple" },
                  { id: "CREATOR", label: "Creator" },
                  { id: "ADMIN", label: "Admin" },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRole(r.id as UserRole)}
                    className={`py-1.5 rounded-xl text-[10px] font-bold text-center transition-all ${
                      selectedRole === r.id
                        ? "bg-gold-gradient text-velora-bg font-bold shadow-gold-glow"
                        : "text-velora-textMuted hover:text-white"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="w-full text-xs font-bold uppercase tracking-wider py-3.5 shadow-gold-glow flex items-center justify-center gap-2 pt-2"
            >
              <span>{t("auth.login")}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="border-t border-white/10 pt-4 space-y-2">
            <span className="text-[10px] uppercase font-bold text-velora-textMuted font-mono block text-center">
              Fast 1-Click Demo Logins
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("MEMBER", "single.member@velora.club")}
                className="p-2 rounded-xl glass-panel border border-white/10 text-[10px] font-bold text-velora-textSecondary hover:text-velora-gold hover:border-velora-gold/40 text-left flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-velora-gold" /> Demo Single
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin("COUPLE", "couple.berlin@velora.club")}
                className="p-2 rounded-xl glass-panel border border-white/10 text-[10px] font-bold text-velora-textSecondary hover:text-amber-300 hover:border-amber-400/40 text-left flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5 text-amber-400" /> Demo Couple
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin("CREATOR", "creator.valerie@velora.club")}
                className="p-2 rounded-xl glass-panel border border-white/10 text-[10px] font-bold text-velora-textSecondary hover:text-amber-300 hover:border-amber-400/40 text-left flex items-center gap-1.5"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" /> Demo Creator
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin("ADMIN", "admin@velora.club")}
                className="p-2 rounded-xl glass-panel border border-white/10 text-[10px] font-bold text-velora-textSecondary hover:text-red-400 hover:border-red-400/40 text-left flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-red-400" /> Demo Admin
              </button>
            </div>
          </div>
        </Card>

        {/* Link to Register */}
        <div className="text-center text-xs text-velora-textMuted">
          Don't have a Velora account yet?{" "}
          <Link href="/register" className="text-velora-gold font-bold hover:underline">
            {t("auth.register")}
          </Link>
        </div>
      </div>
    </div>
  );
}
