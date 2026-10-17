"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { safeReturnTo } from "@/lib/auth/accountState.mjs";
import { AuthField, AuthMessage, AuthShell, friendlyAuthError, requestAuthEmail, submitClass } from "@/components/auth/AuthShell";

const LINK_ERRORS: Record<string, string> = {
  link_invalid: "That sign-in link is invalid. Request a new one below.",
  link_expired: "That link has expired or was already used. Request a new one below.",
};

function LoginForm() {
  const params = useSearchParams();
  const returnTo = safeReturnTo(params.get("returnTo")) || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(LINK_ERRORS[params.get("error") || ""] || "");
  const [info, setInfo] = useState("");

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(""); setInfo("");
    const { error: signInError } = await createBrowserSupabase().auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) { setError(friendlyAuthError(signInError.message)); setBusy(false); return; }
    window.location.assign(returnTo);
  };

  const sendMagicLink = async () => {
    if (!email.trim()) { setError("Enter your email first."); return; }
    setBusy(true); setError(""); setInfo("");
    const failure = await requestAuthEmail({ action: "magiclink", email: email.trim(), next: returnTo });
    setBusy(false);
    if (failure) setError(failure);
    else setInfo("A sign-in link is on its way. Check your inbox.");
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to Intimo" footer={<>New here? <Link href="/register" className="font-semibold text-velora-gold hover:underline">Create an account</Link></>}>
      <form onSubmit={signIn} className="space-y-4" noValidate>
        <AuthField id="email" label="Email" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <AuthField id="password" label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <AuthMessage tone="error">{error}</AuthMessage>}
        {info && <AuthMessage tone="info">{info}</AuthMessage>}
        <button type="submit" disabled={busy || !email || !password} className={submitClass}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
      <div className="flex flex-col items-center gap-3 border-t border-white/[0.06] pt-4 text-sm">
        <button type="button" onClick={sendMagicLink} disabled={busy} className="font-semibold text-velora-gold hover:underline disabled:opacity-50">Email me a sign-in link instead</button>
        <Link href="/reset-password" className="text-velora-textSecondary hover:text-velora-textPrimary">Forgot your password?</Link>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return <Suspense fallback={null}><LoginForm /></Suspense>;
}
