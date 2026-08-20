"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, LogOut, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";

const POLL_INTERVAL_MS = 5_000;
const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage() {
  const { authIdentity, authState, isAuthLoading, logoutWithAuth0 } = useAuth();
  const [checking, setChecking] = useState(false);
  const [verified, setVerified] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const redirecting = useRef(false);

  const continueToOnboarding = useCallback(() => {
    if (redirecting.current) return;
    redirecting.current = true;
    window.location.replace("/onboarding");
  }, []);

  const checkStatus = useCallback(async (manual = false) => {
    if (redirecting.current) return;
    if (manual) setChecking(true);
    try {
      const response = await fetch(`/api/auth/verify-status?t=${Date.now()}`, {
        cache: "no-store",
        credentials: "same-origin",
      });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 401) {
        setStatusError("Your sign-in session expired. Please sign in again.");
        return;
      }
      if (response.status === 429) return;
      if (!response.ok) {
        setStatusError(payload.error || "We could not check your verification status. Try again shortly.");
        return;
      }
      setStatusError("");
      if (payload.verified) {
        setVerified(true);
        window.setTimeout(continueToOnboarding, 700);
      }
    } catch {
      setStatusError("We could not reach the verification service. Check your connection and try again.");
    } finally {
      if (manual) setChecking(false);
    }
  }, [continueToOnboarding]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (authState === "ONBOARDING_REQUIRED") {
      continueToOnboarding();
      return;
    }
    if (authState === "ACTIVE") {
      window.location.replace("/dashboard");
      return;
    }
    if (authState !== "EMAIL_VERIFICATION_REQUIRED") return;

    void checkStatus();
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") void checkStatus();
    }, POLL_INTERVAL_MS);
    const onFocus = () => void checkStatus();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener("focus", onFocus);
    };
  }, [authState, checkStatus, continueToOnboarding, isAuthLoading]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1_000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function resend() {
    if (resending || cooldown > 0) return;
    setResending(true);
    setResendMessage("");
    setStatusError("");
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        credentials: "same-origin",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = Number(response.headers.get("Retry-After") || payload.retryAfter || RESEND_COOLDOWN_SECONDS);
          setCooldown(Math.max(1, retryAfter));
        }
        throw new Error(payload.error || "A new verification email could not be sent.");
      }
      if (payload.alreadyVerified) {
        setVerified(true);
        window.setTimeout(continueToOnboarding, 400);
        return;
      }
      setResendMessage("A new verification email was sent. Check your inbox and spam folder.");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "A new verification email could not be sent.");
    } finally {
      setResending(false);
    }
  }

  const sessionMissing = !isAuthLoading && (authState === "ANONYMOUS" || authState === "ERROR");

  return (
    <main className="flex min-h-[75vh] items-center justify-center px-4 py-12">
      <Card variant="goldBorder" className="w-full max-w-lg space-y-6 p-7 text-center md:p-9">
        {isAuthLoading ? (
          <div className="space-y-4 py-8"><RefreshCw className="mx-auto h-10 w-10 animate-spin text-velora-gold" /><p className="text-sm text-velora-textSecondary">Checking your account…</p></div>
        ) : verified ? (
          <div className="space-y-5 py-4">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" />
            <div><h1 className="font-serif text-3xl font-bold text-velora-textPrimary">Email verified</h1><p className="mt-2 text-sm text-velora-textSecondary">Opening your profile setup now.</p></div>
            <Button className="w-full" size="lg" onClick={continueToOnboarding}>Continue <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
        ) : sessionMissing ? (
          <div className="space-y-5 py-4">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-400" />
            <div><h1 className="font-serif text-2xl font-bold text-velora-textPrimary">Sign in again</h1><p className="mt-2 text-sm leading-relaxed text-velora-textSecondary">Your verification link may have opened outside your active Intimo session. Sign in again and we will re-check your email automatically.</p></div>
            {statusError && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{statusError}</p>}
            <Button className="w-full" size="lg" onClick={() => { window.location.href = "/auth/login?returnTo=%2Fverify-email"; }}>Sign in to continue</Button>
          </div>
        ) : (
          <div className="space-y-6 py-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-velora-gold/30 bg-velora-gold/10"><Mail className="h-8 w-8 text-velora-gold" /></div>
            <div><h1 className="font-serif text-3xl font-bold text-velora-textPrimary">Check your email</h1><p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-velora-textSecondary">Open the verification link sent to <strong className="text-velora-textPrimary">{authIdentity?.email || "your email address"}</strong>. Keep this page open; it will continue automatically.</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-sm text-velora-textSecondary"><p className="font-semibold text-velora-textPrimary">Didn’t receive it?</p><p className="mt-1">Check spam, confirm the address above, or request one new email below.</p></div>
            {resendMessage && <p role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{resendMessage}</p>}
            {statusError && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{statusError}</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="glass" disabled={checking} onClick={() => void checkStatus(true)}><RefreshCw className={`mr-2 h-4 w-4 ${checking ? "animate-spin" : ""}`} />{checking ? "Checking…" : "I verified my email"}</Button>
              <Button disabled={resending || cooldown > 0} onClick={resend}><Mail className="mr-2 h-4 w-4" />{resending ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}</Button>
            </div>
            <button type="button" onClick={() => logoutWithAuth0("/login")} className="mx-auto flex items-center gap-2 text-xs text-velora-textMuted transition hover:text-velora-textPrimary"><LogOut className="h-3.5 w-3.5" />Use a different account</button>
          </div>
        )}
      </Card>
    </main>
  );
}
