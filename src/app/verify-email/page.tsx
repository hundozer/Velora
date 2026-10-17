"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AuthMessage, AuthShell, requestAuthEmail, submitClass } from "@/components/auth/AuthShell";

const RESEND_COOLDOWN_SECONDS = 60;

function VerifyEmail() {
  const params = useSearchParams();
  const { authIdentity } = useAuth();
  const email = params.get("email") || authIdentity?.email || "";
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<{ tone: "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1_000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const resend = async () => {
    if (!email) return;
    setMessage(null);
    // A sign-in link also confirms the address, so it doubles as "resend confirmation".
    const failure = await requestAuthEmail({ action: "magiclink", email, next: "/onboarding" });
    if (failure) { setMessage({ tone: "error", text: failure }); return; }
    setCooldown(RESEND_COOLDOWN_SECONDS);
    setMessage({ tone: "info", text: "Sent. The newest link is the one that works." });
  };

  return (
    <AuthShell title="Check your email" footer={<Link href="/login" className="text-velora-gold hover:underline">Back to sign in</Link>}>
      <div className="flex items-start gap-3 text-sm text-velora-textSecondary">
        <Mail className="mt-0.5 h-5 w-5 shrink-0 text-velora-gold" aria-hidden />
        <p>We sent a confirmation link{email ? <> to <strong className="text-velora-textPrimary">{email}</strong></> : null}. Open it on any device to activate your account and set up your profile.</p>
      </div>
      {message && <AuthMessage tone={message.tone}>{message.text}</AuthMessage>}
      <button type="button" onClick={resend} disabled={!email || cooldown > 0} className={submitClass}>
        {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend the link"}
      </button>
      <p className="text-xs text-velora-textMuted">Nothing arriving? Check spam, or sign up again with the correct address.</p>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return <Suspense fallback={null}><VerifyEmail /></Suspense>;
}
