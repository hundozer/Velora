"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmailVerificationService } from "@/lib/auth/emailVerification";
import { EmailNotificationService } from "@/lib/notifications/emailService";
import { Sparkles, ArrowRight, User, Users, Crown, Mail, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState("");
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
      const originUrl = typeof window !== "undefined" ? window.location.origin : "https://intimo.live";
      EmailNotificationService.sendVerificationEmail(email, pending.token, originUrl);
      setResendSent(true);
    }
  };

  if (isSubmitted) {
    const latestEmail = EmailNotificationService.getLatestEmailFor(email);

    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 text-left">
        <div className="max-w-lg w-full space-y-6">
          <Card variant="goldBorder" className="p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-2xl">
              <Mail className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-serif font-bold text-velora-textPrimary">
                Check Your Email Inbox
              </h2>
              <p className="text-xs text-velora-textSecondary leading-relaxed">
                We generated a confirmation email for <span className="text-velora-gold font-bold">{email}</span>.
              </p>
            </div>

            {/* Local Sandbox / Demo Email Box */}
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Simulated Email Inbox (Development Mode)
                </span>
                <span className="text-[10px] text-velora-textMuted">Just Now</span>
              </div>

              <div className="space-y-1 text-[11px]">
                <p><span className="text-velora-textMuted">From:</span> <span className="text-amber-200">Intimo &lt;noreply@intimo.live&gt;</span></p>
                <p><span className="text-velora-textMuted">To:</span> <span className="text-white font-bold">{email}</span></p>
                <p><span className="text-velora-textMuted">Subject:</span> <span className="text-amber-200">Action Required: Confirm Your Intimo Account Email</span></p>
              </div>

              <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-2">
                <p className="text-[11px] text-velora-textSecondary">
                  Click the button below to confirm your email address:
                </p>

                {latestEmail && latestEmail.confirmationLink ? (
                  <Link href={latestEmail.confirmationLink} className="block pt-1">
                    <Button variant="gold" size="sm" className="w-full text-xs font-bold gap-2 shadow-gold-glow">
                      <CheckCircle2 className="w-4 h-4" /> Confirm Email & Activate Account
                    </Button>
                  </Link>
                ) : null}
              </div>
            </div>

            {resendSent ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-xs text-emerald-300">
                ✓ Fresh confirmation link generated for {email}!
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
                <Button variant="ghost" size="sm" className="w-full text-xs text-velora-textMuted hover:text-velora-gold">
                  Return to Sign In
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
          <h1 className="text-3xl font-serif font-bold text-velora-textPrimary">Join Intimo</h1>
          <p className="text-xs text-velora-textSecondary leading-relaxed">
            Create your private identity to explore connections and meet open-minded people.
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

            {/* Display Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
                2. Display Name
              </label>
              <input
                type="text"
                placeholder="Your display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-velora-textPrimary text-sm placeholder-velora-textMuted focus:border-velora-gold/50 focus:outline-none focus:ring-1 focus:ring-velora-gold/30 transition-all"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
                3. Email Address
              </label>
              <input
                type="email"
                placeholder="you@intimo.live"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-velora-textPrimary text-sm placeholder-velora-textMuted focus:border-velora-gold/50 focus:outline-none focus:ring-1 focus:ring-velora-gold/30 transition-all"
                required
              />
            </div>

            <Button variant="gold" size="lg" className="w-full text-xs font-bold gap-2 uppercase tracking-widest" type="submit">
              Create Account <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <p className="text-center text-[12px] text-velora-textMuted">
            Already have an account?{" "}
            <Link href="/login" className="text-velora-gold hover:text-velora-amber font-medium transition-colors">
              Sign In
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
