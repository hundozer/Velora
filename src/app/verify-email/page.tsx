"use client";

import { useTranslation } from "@/context/LanguageContext";
import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AuthMessage, AuthShell, requestAuthEmail, submitClass } from "@/components/auth/AuthShell";

const RESEND_COOLDOWN_SECONDS = 60;

function VerifyEmail() {
  const { t } = useTranslation();
  const params = useSearchParams();
  const { authIdentity } = useAuth();
  const email = params.get("email") || authIdentity?.email || "";
  const inviteToken = params.get("invite") || "";
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
    const failure = await requestAuthEmail({ action: "magiclink", email, next: "/onboarding", inviteToken });
    if (failure) { setMessage({ tone: "error", text: failure }); return; }
    setCooldown(RESEND_COOLDOWN_SECONDS);
    setMessage({ tone: "info", text: "Sent. The newest link is the one that works." });
  };

  return (
    <AuthShell title={t("Check your email")} footer={<Link href="/login" className="text-velora-gold hover:underline">{t("Back to sign in")}</Link>}>
      <div className="flex items-start gap-3 text-sm text-velora-textSecondary">
        <Mail className="mt-0.5 h-5 w-5 shrink-0 text-velora-gold" aria-hidden />
        <p>{email ? <>{t("We sent a confirmation link to")}{" "}<strong className="text-velora-textPrimary">{email}</strong></> : t("We sent a confirmation link")}. {t("Open it on any device to activate your account and set up your profile.")}</p>
      </div>
      {message && <AuthMessage tone={message.tone}>{t(message.text)}</AuthMessage>}
      <button type="button" onClick={resend} disabled={!email || cooldown > 0} className={submitClass}>
        {cooldown > 0 ? t("Resend in {cooldown}s", { cooldown: cooldown }) : t("Resend the link")}
      </button>
      <p className="text-xs text-velora-textMuted">{t("Nothing arriving? Check spam, or sign up again with the correct address.")}</p>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return <Suspense fallback={null}><VerifyEmail /></Suspense>;
}
