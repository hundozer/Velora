"use client";

import { useTranslation } from "@/context/LanguageContext";
import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, UserRound } from "lucide-react";
import { AuthField, AuthMessage, AuthShell, requestAuthEmail, submitClass } from "@/components/auth/AuthShell";

const MIN_PASSWORD = 10;
const TOKEN = /^[a-zA-Z0-9_-]{43}$/;
type InviteState = "checking" | "valid" | "expired" | "used" | "invalid" | "unavailable";

/**
 * Accept an invitation. Intimo is invitation-only, so this page only shows the
 * sign-up form for a working personal invitation link; everyone else learns how
 * joining works instead of meeting a form they can't submit. The invitation is
 * still enforced on the server at sign-up and at profile creation.
 */
function RegisterForm() {
  const params = useSearchParams();
  const inviteToken = params.get("invite") || "";
  const hasToken = TOKEN.test(inviteToken);
  const [state, setState] = useState<InviteState>(hasToken ? "checking" : "invalid");

  useEffect(() => {
    if (!hasToken) { setState("invalid"); return; }
    let live = true;
    setState("checking");
    fetch(`/api/invitations/check?invite=${encodeURIComponent(inviteToken)}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((payload) => { if (live) setState(["valid", "expired", "used", "invalid"].includes(payload?.state) ? payload.state : "unavailable"); })
      // If the check itself is down, let the invited person try; sign-up re-checks it.
      .catch(() => { if (live) setState("unavailable"); });
    return () => { live = false; };
  }, [hasToken, inviteToken]);

  if (!inviteToken) return <InvitationOnly />;
  if (state === "checking") return <AuthShell title="Your invitation to Intimo" subtitle="Checking your invitation…"><span className="sr-only" role="status">…</span></AuthShell>;
  if (state === "expired" || state === "used" || state === "invalid") return <InvitationProblem state={state} />;
  return <SignUp inviteToken={inviteToken} />;
}

function InvitationOnly() {
  const { t } = useTranslation();
  return (
    <AuthShell
      title="Intimo is invitation-only"
      subtitle="To join, a member invites you by email. Their invitation is your way in."
      footer={<>{t("Already a member?")}{" "}<Link href="/login" className="font-semibold text-velora-gold">{t("Sign in")}</Link></>}
    >
      <ol className="space-y-4">
        <Step icon={<UserRound className="h-5 w-5" aria-hidden />} title="Know someone on Intimo?" body="Ask them to invite you. Members can send invitations from their account." />
        <Step icon={<Mail className="h-5 w-5" aria-hidden />} title="Got an invitation email?" body="Open the link in it. It brings you back here with everything ready, and only works for the address it was sent to." />
      </ol>
      <p className="text-base text-velora-textMuted">{t("Invitations keep Intimo small, safe and real. There is no waiting list.")}</p>
    </AuthShell>
  );
}

function Step({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  const { t } = useTranslation();
  return (
    <li className="flex gap-4 rounded-3xl border border-velora-line bg-velora-surface p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-velora-accent/15 text-velora-accent">{icon}</span>
      <span>
        <span className="block text-lg font-semibold text-velora-ink">{t(title)}</span>
        <span className="mt-1 block text-base leading-relaxed text-velora-textSecondary">{t(body)}</span>
      </span>
    </li>
  );
}

function InvitationProblem({ state }: { state: "expired" | "used" | "invalid" }) {
  const { t } = useTranslation();
  const copy = {
    expired: { title: "This invitation has expired", body: "Invitations last 30 days. Ask the member who invited you to send a new one." },
    used: { title: "This invitation has already been used", body: "If you joined with it, sign in. If not, ask the member who invited you for a new one." },
    invalid: { title: "This invitation link doesn't work", body: "Check that you opened the whole link from your invitation email, or ask the member who invited you to send it again." },
  }[state];
  return (
    <AuthShell title={copy.title} subtitle="Intimo is invitation-only." footer={<>{t("Already a member?")}{" "}<Link href="/login" className="font-semibold text-velora-gold">{t("Sign in")}</Link></>}>
      <AuthMessage tone="info">{t(copy.body)}</AuthMessage>
    </AuthShell>
  );
}

function SignUp({ inviteToken }: { inviteToken: string }) {
  const { t } = useTranslation();
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
    const failure = await requestAuthEmail({ action: "signup", email: email.trim(), password, adult: agreed, terms: agreed, inviteToken });
    if (failure) { setError(failure); setBusy(false); return; }
    window.location.assign(`/verify-email?email=${encodeURIComponent(email.trim())}&invite=${encodeURIComponent(inviteToken)}`);
  };

  return (
    <AuthShell title="Your invitation to Intimo" subtitle="Membership is by invitation. Free to join. Adults only." footer={<>{t("Already a member?")}{" "}<Link href="/login" className="font-semibold text-velora-gold">{t("Sign in")}</Link></>}>
      <AuthMessage tone="info">{t("Use the email address your invitation was sent to.")}</AuthMessage>
      <form onSubmit={register} className="space-y-5" noValidate>
        <AuthField id="email" label={t("Email")} type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <div className="space-y-2">
          <AuthField id="password" label={t("Password")} type="password" autoComplete="new-password" required minLength={MIN_PASSWORD} value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby="password-hint" />
          <p id="password-hint" className={`text-base ${password.length >= MIN_PASSWORD ? "text-velora-success" : "text-velora-textMuted"}`}>{password.length >= MIN_PASSWORD ? t("Good") : t("{MIN_PASSWORD}+ characters", { MIN_PASSWORD: MIN_PASSWORD })}</p>
        </div>
        <label className={`flex w-full cursor-pointer items-center gap-4 rounded-3xl border-2 px-5 py-4 text-base transition ${agreed ? "border-velora-accent bg-velora-accent/[0.06] text-velora-ink" : "border-velora-line bg-velora-surface text-velora-ink2"}`}>
          <input type="checkbox" className="peer sr-only" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-lg font-bold peer-focus-visible:ring-2 peer-focus-visible:ring-velora-gold ${agreed ? "border-velora-accent bg-velora-accent text-velora-paper" : "border-velora-ink/30"}`} aria-hidden>{agreed ? "✓" : ""}</span>
          <span>{t("I'm 18+ and accept the")}{" "}<Link href="/legal/terms" className="text-velora-gold underline">{t("Terms")}</Link>{" "}{t("and")}{" "}<Link href="/legal/privacy-policy" className="text-velora-gold underline">{t("Privacy Policy")}</Link></span>
        </label>
        {error && <AuthMessage tone="error">{t(error)}</AuthMessage>}
        <button type="submit" disabled={busy || !ready} className={submitClass}>{busy ? t("Creating account…") : t("Create account")}</button>
      </form>
    </AuthShell>
  );
}

export default function RegisterPage() { return <Suspense fallback={null}><RegisterForm /></Suspense>; }
