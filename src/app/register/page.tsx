"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AuthField, AuthMessage, AuthShell, requestAuthEmail, submitClass } from "@/components/auth/AuthShell";

const MIN_PASSWORD = 10;

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // One tap covers both declarations; the API still receives both flags.
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const ready = email.trim() && password.length >= MIN_PASSWORD && agreed;

  const register = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready) return;
    setBusy(true); setError("");
    const failure = await requestAuthEmail({ action: "signup", email: email.trim(), password, adult: agreed, terms: agreed });
    if (failure) { setError(failure); setBusy(false); return; }
    window.location.assign(`/verify-email?email=${encodeURIComponent(email.trim())}`);
  };

  return (
    <AuthShell title="Join Intimo" subtitle="Free and private. 18+ only." footer={<>Already a member? <Link href="/login" className="font-semibold text-velora-gold">Sign in</Link></>}>
      <form onSubmit={register} className="space-y-5" noValidate>
        <AuthField id="email" label="Email" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <div className="space-y-2">
          <AuthField id="password" label="Password" type="password" autoComplete="new-password" required minLength={MIN_PASSWORD} value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby="password-hint" />
          <p id="password-hint" className={`text-base ${password.length >= MIN_PASSWORD ? "text-velora-success" : "text-velora-textMuted"}`}>{password.length >= MIN_PASSWORD ? "Good" : `${MIN_PASSWORD}+ characters`}</p>
        </div>
        <label className={`flex w-full cursor-pointer items-center gap-4 rounded-3xl border-2 px-5 py-4 text-base transition ${agreed ? "border-velora-accent bg-velora-accent/[0.06] text-velora-ink" : "border-velora-line bg-velora-surface text-velora-ink2"}`}>
          <input type="checkbox" className="peer sr-only" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-lg font-bold peer-focus-visible:ring-2 peer-focus-visible:ring-velora-gold ${agreed ? "border-velora-accent bg-velora-accent text-velora-paper" : "border-velora-ink/30"}`} aria-hidden>{agreed ? "✓" : ""}</span>
          <span>I&apos;m 18+ and accept the <Link href="/legal/terms" className="text-velora-gold underline">Terms</Link> and <Link href="/legal/privacy-policy" className="text-velora-gold underline">Privacy Policy</Link></span>
        </label>
        {error && <AuthMessage tone="error">{error}</AuthMessage>}
        <button type="submit" disabled={busy || !ready} className={submitClass}>{busy ? "Creating account…" : "Create account"}</button>
      </form>
    </AuthShell>
  );
}
