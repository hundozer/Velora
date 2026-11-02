"use client";

import { useTranslation } from "@/context/LanguageContext";
import React, { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { AuthField, AuthMessage, AuthShell, friendlyAuthError, submitClass } from "@/components/auth/AuthShell";

export default function UpdatePasswordPage() {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 10) { setError("Use at least 10 characters."); return; }
    setBusy(true); setError("");
    const { error: updateError } = await createBrowserSupabase().auth.updateUser({ password });
    if (updateError) { setError(friendlyAuthError(updateError.message)); setBusy(false); return; }
    window.location.assign("/dashboard");
  };

  return (
    <AuthShell title={t("Choose a new password")}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <AuthField id="password" label={t("New password")} type="password" autoComplete="new-password" required minLength={10} value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <AuthMessage tone="error">{t(error)}</AuthMessage>}
        <button type="submit" disabled={busy || !password} className={submitClass}>{busy ? t("Saving…") : t("Save password")}</button>
      </form>
    </AuthShell>
  );
}
