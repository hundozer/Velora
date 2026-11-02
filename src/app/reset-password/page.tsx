"use client";

import { useTranslation } from "@/context/LanguageContext";
import React, { useState } from "react";
import Link from "next/link";
import { AuthField, AuthMessage, AuthShell, requestAuthEmail, submitClass } from "@/components/auth/AuthShell";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setError("");
    const failure = await requestAuthEmail({ action: "recovery", email: email.trim() });
    setBusy(false);
    if (failure) setError(failure); else setSent(true);
  };

  return (
    <AuthShell title={t("Reset password")} subtitle={t("We'll email you a link to choose a new one")} footer={<Link href="/login" className="text-velora-gold hover:underline">{t("Back to sign in")}</Link>}>
      {sent ? <AuthMessage tone="info">{t("If an account exists for {trim}, a reset link is on its way. It expires in one hour.", { trim: email.trim() })}</AuthMessage> : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <AuthField id="email" label={t("Email")} type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && <AuthMessage tone="error">{t(error)}</AuthMessage>}
          <button type="submit" disabled={busy || !email.trim()} className={submitClass}>{busy ? t("Sending…") : t("Send reset link")}</button>
        </form>
      )}
    </AuthShell>
  );
}
