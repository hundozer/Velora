"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmailVerificationService } from "@/lib/auth/emailVerification";
import { EmailNotificationService } from "@/lib/notifications/emailService";
import { Sparkles, ShieldCheck, Lock, ArrowRight, User, Users, Crown, Mail, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedRole, setSelectedRole] = useState<"MEMBER" | "COUPLE" | "CREATOR">("MEMBER");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !displayName) return;

    register({
      email,
      displayName,
      role: selectedRole,
    });

    setIsSubmitted(true);
  };

  const handleResend = () => {
    if (!email) return;
    const pending = EmailVerificationService.resendToken(email);
    if (pending) {
      const originUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      EmailNotificationService.sendVerificationEmail(email, pending.token, originUrl);
      setResendSent(true);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 text-left">
        <div className="max-w-md w-full space-y-6">
          <Card variant="goldBorder" className="p-8 space-y-6 text-center bg-gold-card">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-2xl">
              <Mail className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-serif font-bold text-velora-textPrimary">
                Check Your Email Inbox
              </h2>
              <p className="text-xs text-velora-textSecondary leading-relaxed">
                We sent a confirmation email to <span className="text-velora-gold font-bold">{email}</span>.
              </p>
            </div>

            <div className="p-4 glass-panel rounded-2xl border border-white/10 text-left text-xs space-y-2 font-mono text-velora-textSecondary">
              <p className="flex items-center gap-2 text-velora-gold font-bold">
                <ShieldCheck className="w-4 h-4" /> Email Verification Required
              </p>
              <p className="text-[11px] leading-relaxed">
                To complete your registration and activate your Velora account, please open the email and click the confirmation link before logging in.
              </p>
            </div>

            {resendSent ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-xs text-emerald-300">
                ✓ Fresh confirmation link sent to {email}!
              </div>
            ) : (
              <Button
                variant="glass"
                size="sm"
                className="w-full text-xs font-bold gap-2 border-white/20 hover:border-velora-gold/40"
                onClick={handleResend}
              >
                <Mail className="w-4 h-4 text-velora-gold" /> Resend Confirmation Email
              </Button>
            )}

            <div className="pt-2">
              <Link href="/login">
                <Button variant="gold" size="lg" className="w-full text-xs font-bold uppercase tracking-wider shadow-gold-glow flex items-center justify-center gap-2">
                  <span>Go to Login</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 text-left">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-velora-gold/20 text-velora-gold border border-velora-gold/40 uppercase tracking-widest inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> PRIVATE MEMBERS CLUB
          </span>
          <h1 className="text-3xl font-serif font-bold text-velora-textPrimary">Enter Velora</h1>
          <p className="text-xs text-velora-textSecondary leading-relaxed">
            Create your private identity to explore adult connections and meet open-minded people.
          </p>
        </div>

        <Card variant="goldBorder" className="p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Choose Identity Type */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
                1. Choose Your Identity
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole("MEMBER")}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    selectedRole === "MEMBER"
                      ? "bg-gold-gradient text-velora-bg font-bold border-velora-gold"
                      : "glass-panel text-velora-textMuted hover:text-white"
                  }`}
                >
                  <User className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-xs">Individual</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole("COUPLE")}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    selectedRole === "COUPLE"
                      ? "bg-gold-gradient text-velora-bg font-bold border-velora-gold"
                      : "glass-panel text-velora-textMuted hover:text-white"
                  }`}
                >
                  <Users className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-xs">Couple</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole("CREATOR")}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    selectedRole === "CREATOR"
                      ? "bg-gold-gradient text-velora-bg font-bold border-velora-gold"
                      : "glass-panel text-velora-textMuted hover:text-white"
                  }`}
                >
                  <Crown className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-xs">Creator</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-1">
                Display Name / Persona
              </label>
              <Input
                type="text"
                placeholder="e.g. Elena V."
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-1">
                Private Email
              </label>
              <Input
                type="email"
                placeholder="you@private.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-1">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button variant="gold" type="submit" className="w-full text-xs font-bold uppercase tracking-wider py-3 shadow-gold-glow flex items-center justify-center gap-2">
              <span>Continue to Onboarding</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="pt-4 border-t border-white/10 text-center text-xs text-velora-textMuted">
            Already have a private identity?{" "}
            <Link href="/login" className="text-velora-gold font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
