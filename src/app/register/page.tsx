"use client";

import React, { useState } from "react";
import Link from "next/link";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { AuthField, AuthMessage, AuthShell, friendlyAuthError, submitClass } from "@/components/auth/AuthShell";

const MIN_PASSWORD = 10;

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adult, setAdult] = useState(false);
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const passwordError = password.length > 0 && password.length < MIN_PASSWORD ? `Use at least ${MIN_PASSWORD} characters.` : "";
  const ready = email.trim() && password.length >= MIN_PASSWORD && adult && terms;

  const register = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready) return;
    setBusy(true); setError("");
    const { data, error: signUpError } = await createBrowserSupabase().auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=%2Fonboarding` },
    });
    if (signUpError) { setError(friendlyAuthError(signUpError.message)); setBusy(false); return; }
    // With email confirmation enabled Supabase returns no session until the link is clicked.
    if (data.session) window.location.assign("/onboarding");
    else window.location.assign(`/verify-email?email=${encodeURIComponent(email.trim())}`);
  };

  return (
    <AuthShell title="Join Intimo" subtitle="Free, private and strictly 18+" footer={<>Already a member? <Link href="/login" className="font-semibold text-velora-gold hover:underline">Sign in</Link></>}>
      <form onSubmit={register} className="space-y-4" noValidate>
        <AuthField id="email" label="Email" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <div>
          <AuthField id="password" label="Password" type="password" autoComplete="new-password" required minLength={MIN_PASSWORD} value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby="password-hint" />
          <p id="password-hint" className={`mt-1.5 text-xs ${passwordError ? "text-red-300" : "text-velora-textMuted"}`}>{passwordError || `At least ${MIN_PASSWORD} characters.`}</p>
        </div>
        <label className="flex items-start gap-3 text-sm text-velora-textSecondary">
          <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-amber-400" />
          <span>I am at least 18 years old.</span>
        </label>
        <label className="flex items-start gap-3 text-sm text-velora-textSecondary">
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-amber-400" />
          <span>I accept the <Link href="/legal/terms" className="text-velora-gold underline">Terms</Link> and <Link href="/legal/privacy-policy" className="text-velora-gold underline">Privacy Policy</Link>.</span>
        </label>
        {error && <AuthMessage tone="error">{error}</AuthMessage>}
        <button type="submit" disabled={busy || !ready} className={submitClass}>{busy ? "Creating account…" : "Create account"}</button>
      </form>
    </AuthShell>
  );
}
