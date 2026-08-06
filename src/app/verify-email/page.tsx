"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { EmailVerificationService } from "@/lib/auth/emailVerification";
import { CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Mail, RefreshCw } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [waitingForPoll, setWaitingForPoll] = useState(false);

  const [cookieActive, setCookieActive] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined" && document.cookie.includes("intimo_user_data=")) {
      setCookieActive(true);
    }
  }, []);

  useEffect(() => {
    // Case 1: Checking explicit token verification link
    if (token) {
      const timer = setTimeout(() => {
        const result = EmailVerificationService.verifyToken(token);
        setSuccess(result.success);
        setMessage(result.message);
        if (result.email) setEmail(result.email);
        setLoading(false);
      }, 1000);

      return () => clearTimeout(timer);
    }

    // Case 2: Waiting for email verification polling (Background sync)
    if (!token && user && user.verificationStatus === "UNVERIFIED") {
      setLoading(false);
      setWaitingForPoll(true);
      setEmail(user.email);

      console.log("Starting background verification polling for user session...");
      const pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`/api/auth/verify-status?t=${Date.now()}`, { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            if (data.verified) {
              clearInterval(pollInterval);
              setSuccess(true);
              setMessage("Email address verified! Proceeding to onboarding...");
              setWaitingForPoll(false);
              // Force page redirect after 1.5 seconds so context can update routing
              setTimeout(() => {
                window.location.href = "/onboarding";
              }, 1500);
            }
          }
        } catch (err) {
          console.error("Error polling verification status:", err);
        }
      }, 2000);

      return () => clearInterval(pollInterval);
    }

    // Case 3: Token missing, check if session is restoring
    if (cookieActive && !user) {
      setLoading(true);
      return;
    }

    // Case 4: Token missing and no active user session
    setLoading(false);
    setSuccess(false);
    setMessage("Verification token missing. Please check your email inbox for the confirmation link.");
  }, [token, user, cookieActive]);

  const handleResend = () => {
    if (!email) return;
    setResending(true);
    setTimeout(() => {
      EmailVerificationService.resendToken(email);
      setResendSuccess(true);
      setResending(false);
    }, 800);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 text-left">
      <Card variant="goldBorder" className="w-full max-w-md p-8 space-y-6 bg-gold-card text-center">
        {loading ? (
          <div className="py-8 space-y-4">
            <RefreshCw className="w-12 h-12 text-velora-gold animate-spin mx-auto" />
            <h2 className="text-xl font-serif font-bold text-velora-textPrimary">
              Verifying Email Address...
            </h2>
            <p className="text-xs text-velora-textSecondary font-mono">
              Validating time-limited security token
            </p>
          </div>
        ) : success ? (
          <div className="py-4 space-y-5">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-2xl">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-serif font-bold text-velora-textPrimary">
                Email Confirmed!
              </h2>
              <p className="text-xs text-emerald-300 leading-relaxed font-mono">
                {message}
              </p>
            </div>

            <div className="p-4 glass-panel rounded-2xl border border-white/10 text-left text-xs space-y-1 font-mono">
              <span className="text-velora-textMuted block">Verified Email Account:</span>
              <span className="text-velora-gold font-bold">{email || "Confirmed"}</span>
            </div>

            <Link href="/login" className="block pt-2">
              <Button variant="gold" size="lg" className="w-full text-xs font-bold uppercase tracking-wider shadow-gold-glow flex items-center justify-center gap-2">
                <span>Sign In to Intimo</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        ) : waitingForPoll ? (
          <div className="py-4 space-y-5">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-velora-gold flex items-center justify-center mx-auto animate-pulse">
              <Mail className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-serif font-bold text-velora-textPrimary">
                Confirm Your Email Address 📩
              </h2>
              <p className="text-xs text-velora-textSecondary leading-relaxed max-w-sm mx-auto">
                We sent a confirmation link to your inbox. Please check your email client and verify your account.
              </p>
            </div>

            <div className="p-4 glass-panel rounded-2xl border border-white/10 text-left text-xs space-y-1 font-mono">
              <span className="text-velora-textMuted block text-[10px] uppercase font-bold tracking-wider">Unverified Email Account:</span>
              <span className="text-white font-bold">{email}</span>
            </div>

            <div className="flex items-center justify-center gap-2 py-2 text-xs text-velora-gold font-bold font-mono">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Waiting for confirmation...</span>
            </div>

            <p className="text-[10px] text-velora-textMuted max-w-xs mx-auto leading-normal">
              Once you click the link inside your email, this window will automatically proceed to your profile setup.
            </p>

            {resendSuccess ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-xs text-emerald-300">
                Fresh verification link sent! Check your inbox.
              </div>
            ) : (
              <Button
                variant="gold"
                size="sm"
                className="w-full text-xs font-bold gap-2 shadow-gold-glow"
                onClick={handleResend}
                disabled={resending}
              >
                <Mail className="w-4 h-4 text-black" />
                <span>{resending ? "Sending..." : "Resend Confirmation Email"}</span>
              </Button>
            )}

            <Link href="/login" className="block text-xs text-velora-textMuted hover:text-velora-gold pt-2 underline">
              Return to Sign In
            </Link>
          </div>
        ) : (
          <div className="py-4 space-y-5">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-serif font-bold text-velora-textPrimary">
                Verification Failed
              </h2>
              <p className="text-xs text-red-300 leading-relaxed font-mono">
                {message}
              </p>
            </div>

            {resendSuccess ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-xs text-emerald-300">
                Fresh verification link sent! Check your email inbox.
              </div>
            ) : (
              <Button
                variant="glass"
                size="sm"
                className="w-full text-xs font-bold gap-2 border-white/20 hover:border-velora-gold/40"
                onClick={handleResend}
                disabled={resending}
              >
                <Mail className="w-4 h-4 text-velora-gold" />
                <span>{resending ? "Sending..." : "Resend Confirmation Email"}</span>
              </Button>
            )}

            <Link href="/login" className="block text-xs text-velora-textMuted hover:text-velora-gold pt-2">
              Return to Sign In
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[75vh] flex items-center justify-center">
        <RefreshCw className="w-10 h-10 text-velora-gold animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
