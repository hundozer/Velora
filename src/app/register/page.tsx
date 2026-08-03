"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmailVerificationService } from "@/lib/auth/emailVerification";
import { EmailNotificationService } from "@/lib/notifications/emailService";
import { Sparkles, ShieldCheck, Lock, ArrowRight, User, Users, Crown, Mail, CheckCircle2 } from "lucide-react";

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
      const originUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      EmailNotificationService.sendVerificationEmail(email, pending.token, originUrl);
      setResendSent(true);
    }
  };

  if (isSubmitted) {
    const latestEmail = EmailNotificationService.getLatestEmailFor(email);

    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 text-left">
        <div className="max-w-lg w-full space-y-6">
          <Card variant="goldBorder" className="p-8 space-y-6 text-center bg-gold-card">
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
                <p><span className="text-velora-textMuted">To:</span> <span className="text-white font-bold">{email}</span></p>
                <p><span className="text-velora-textMuted">Subject:</span> <span className="text-amber-200">Action Required: Confirm Your Velora Account Email</span></p>
              </div>

              <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-2">
                <p className="text-[11px] text-velora-textSecondary">
                  Since live SMTP credentials are not active in this sandbox, click the button below to simulate receiving the email and confirming your address:
                </p>

                {latestEmail ? (
                  <Link href={latestEmail.confirmationLink} className="block pt-1">
                    <Button variant="gold" size="sm" className="w-full text-xs font-bold gap-2 shadow-gold-glow">
                      <CheckCircle2 className="w-4 h-4" /> ⚡ Click to Confirm Email & Activate Account
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
          <h1 className="text-3xl font-serif font-bold text-velora-textPrimary">Join Velora</h1>
          <p className="text-xs text-velora-textSecondary leading-relaxed">
            Create your private identity to explore adult connections • Auth0 SSO Ready
          </p>
        </div>

        <Card variant="goldBorder" className="p-8 space-y-6">
          <div className="space-y-4 text-center">
            <a
              href="/api/auth/login?screen_hint=signup"
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-velora-bg font-bold text-xs uppercase tracking-widest shadow-gold-glow flex items-center justify-center gap-3 hover:scale-[1.02] transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>Register with Auth0</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <div className="p-3 glass-panel rounded-2xl border border-white/10 text-left text-xs space-y-1.5 font-mono">
              <span className="text-velora-gold font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Auth0 Identity Provider
              </span>
              <p className="text-[11px] text-velora-textMuted leading-relaxed">
                Registers your identity securely using Auth0 Universal Login, social logins, and passwordless authentication.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
