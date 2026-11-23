"use client";

import React from "react";
import Link from "next/link";
import { Camera, Clock, ShieldCheck, ShieldAlert } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { uploadFileToR2 } from "@/lib/storage/clientUpload";

type Check = { available: boolean; state?: "REQUIRED" | "RETRY" | "PENDING" | "VERIFIED" | "FAILED" | "UNAVAILABLE"; couple?: boolean; partnerName?: string | null; code?: string; expiresAt?: string };
const ACCEPT = "image/jpeg,image/png,image/webp";

/**
 * FM-06: the age check. One selfie holding a handwritten code (both partners for a couple),
 * reviewed by a person at Intimo. Until it's approved, the member can only set up their profile.
 */
export default function VerifyAgePage() {
  const { t } = useTranslation();
  const [check, setCheck] = React.useState<Check | null>(null);
  const [status, setStatus] = React.useState<"loading" | "ready" | "signed-out" | "error">("loading");
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState<number | null>(null);
  const [error, setError] = React.useState("");
  const [checkingStatus, setCheckingStatus] = React.useState(false);

  const load = React.useCallback(async () => {
    setStatus("loading");
    try {
      const response = await fetch("/api/age-check", { credentials: "same-origin", cache: "no-store" });
      if (response.status === 401) { setStatus("signed-out"); return; }
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) { setStatus("error"); return; }
      setCheck(payload); setStatus("ready");
    } catch { setStatus("error"); }
  }, []);
  React.useEffect(() => { void load(); }, [load]);
  async function refreshStatus() {
    if (checkingStatus) return;
    setCheckingStatus(true);
    setError("");
    try { await load(); }
    finally { setCheckingStatus(false); }
  }
  React.useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function choose(next: File | null) {
    setError("");
    if (preview) URL.revokeObjectURL(preview);
    if (next && !ACCEPT.split(",").includes(next.type)) { setFile(null); setPreview(null); setError("Use a JPEG, PNG or WebP photo."); return; }
    setFile(next); setPreview(next ? URL.createObjectURL(next) : null);
  }

  async function submit() {
    if (!file || progress !== null) return;
    setError(""); setProgress(0);
    try {
      const upload = await uploadFileToR2(file, "photos", setProgress, {
        // The selfie shows only the member (or the couple on the profile), all adults. It is
        // never published: it stays private and only admins reviewing the check can open it.
        containsOtherIdentifiableParticipants: Boolean(check?.couple),
        allParticipantsAdults: true,
        recordingConsented: true,
        publicationConsented: true,
      }, "PRIVATE", "NON_EXPLICIT", "AGE_CHECK");
      const response = await fetch("/api/age-check", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mediaId: upload.mediaId }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.codeExpired ? "Your code expired. Take a new selfie with the new code." : payload.error === "Your age check is already with us" ? "Your age check is already with us." : "Your selfie could not be sent. Please try again.");
        if (payload.codeExpired) await load();
        return;
      }
      choose(null);
      await load();
    } catch {
      setError("Your selfie could not be sent. Please try again.");
    } finally {
      setProgress(null);
    }
  }

  const shell = (children: React.ReactNode) => <main className="mx-auto max-w-xl space-y-6 px-4 pb-24 pt-8">{children}</main>;
  if (status === "loading") return shell(<p className="text-sm text-velora-textMuted">{t("Loading…")}</p>);
  if (status === "signed-out") return shell(<p className="text-sm text-velora-textSecondary"><Link href="/auth/login?returnTo=%2Fverify-age" className="text-velora-accent underline">{t("Sign in")}</Link>{" "}{t("to complete your age check.")}</p>);
  if (status === "error" || !check) return shell(<div className="space-y-4">
    <p role="alert" className="text-sm text-velora-danger">{t("Your age check could not be loaded. Please refresh.")}</p>
    <button type="button" disabled={checkingStatus} onClick={() => void refreshStatus()} className="min-h-11 rounded-full border border-velora-accent px-5 text-sm font-semibold text-velora-accent">{t("Try again")}</button>
  </div>);
  if (!check.available) return shell(<div className="space-y-4">
    <p role="alert" className="text-sm text-velora-textSecondary">{t("The age check is being set up. Please check back soon.")}</p>
    <button type="button" disabled={checkingStatus} onClick={() => void refreshStatus()} className="min-h-11 rounded-full border border-velora-accent px-5 text-sm font-semibold text-velora-accent">{t("Check review status")}</button>
  </div>);

  const header = (
    <header className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-velora-accent">{t("Age check")}</p>
      <h1 className="font-display text-5xl font-bold leading-[1.02] text-velora-textPrimary sm:text-6xl">{t("One last step")}</h1>
    </header>
  );

  if (check.state === "VERIFIED") return shell(<>
    {header}
    <section className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-5">
      <p className="flex items-center gap-2 font-semibold text-velora-textPrimary"><ShieldCheck className="h-5 w-5 text-velora-success" aria-hidden />{t("You're in. Your age check is approved.")}</p>
      {/* A full page load, so the app picks up the approval instead of the status it loaded earlier. */}
      <a href="/dashboard" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-velora-warm px-6 text-sm font-semibold text-velora-paper">{t("Come in")}</a>
    </section>
  </>);

  if (check.state === "PENDING") return shell(<>
    {header}
    <section className="space-y-3 rounded-2xl border border-ink/10 bg-ink/[0.02] p-5">
      <p className="flex items-center gap-2 font-semibold text-velora-textPrimary"><Clock className="h-5 w-5 text-velora-accent" aria-hidden />{t("Thank you. A person at Intimo is reviewing your selfie.")}</p>
      <p className="text-sm leading-relaxed text-velora-textSecondary">{t("Your age check is waiting for manual review. You cannot use the community until it is approved. We cannot guarantee an exact review time.")}</p>
      <p className="text-sm leading-relaxed text-velora-textMuted">{t("You can leave and come back later. Your submitted review remains pending on your account.")}</p>
      <button type="button" onClick={() => void refreshStatus()} disabled={checkingStatus} aria-busy={checkingStatus} className="inline-flex min-h-11 items-center rounded-full bg-velora-warm px-6 text-sm font-semibold text-velora-paper disabled:opacity-50">{checkingStatus ? t("Checking status…") : t("Check review status")}</button>
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/me" className="inline-flex min-h-11 items-center rounded-full border border-velora-accent px-6 text-sm font-bold text-velora-accent">{t("Finish my profile")}</Link>
        <a href="mailto:contact@intimo.live" className="inline-flex min-h-11 items-center text-sm font-semibold text-velora-textSecondary underline underline-offset-4">{t("Contact support")}</a>
      </div>
    </section>
  </>);

  if (check.state === "FAILED" || check.state === "UNAVAILABLE" || !check.code) return shell(<>
    {header}
    <section className="space-y-3 rounded-2xl border border-velora-danger/30 bg-velora-danger/5 p-5">
      <p className="flex items-center gap-2 font-semibold text-velora-textPrimary"><ShieldAlert className="h-5 w-5 text-velora-danger" aria-hidden />{t("We couldn't confirm your age.")}</p>
      <p className="text-sm leading-relaxed text-velora-textSecondary">{t("Intimo is only for adults. If you think this is a mistake, write to us from Settings → Privacy Center and we'll look at it again.")}</p>
      <Link href="/settings" className="inline-flex min-h-11 items-center rounded-full border border-ink/15 px-6 text-sm font-semibold text-velora-textPrimary">{t("Settings")}</Link>
    </section>
  </>);

  return shell(<>
    {header}
    <p className="text-sm leading-relaxed text-velora-textSecondary">{check.state === "RETRY" ? t("We need one more selfie from you. Same steps, new code.") : t("We check everyone to make sure we are all adults here. It takes a minute, and only our team sees your selfie.")}</p>

    <section className="space-y-4 rounded-2xl border border-velora-accent/30 bg-velora-accent/5 p-5">
      <p className="text-sm font-semibold text-velora-textPrimary">{t("1. Write this code somewhere we can read it — a napkin, a coaster or even your hand.")}</p>
      <p className="select-all text-center font-mono text-4xl font-bold tracking-[0.35em] text-velora-textPrimary" aria-label={t("Your code")}>{check.code}</p>
      <p className="text-xs text-velora-textMuted">{t("The code works for 24 hours and only once.")}</p>
      <p className="text-sm font-semibold text-velora-textPrimary">{check.couple ? t("2. Take a selfie together with {partner}, showing the code", { partner: check.partnerName || t("your partner") }) : t("2. Take a selfie showing the code beside your face")}</p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-velora-textSecondary">
        <li>{t("Faces visible, good light, no filters or sunglasses.")}</li>
        <li>{t("Clothes on, keep it simple. This one isn\'t for your profile.")}</li>
        {check.couple && <li>{t("Everyone on your profile must be in the same photo.")}</li>}
      </ul>
    </section>

    <section className="space-y-3">
      <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full border border-velora-accent px-6 text-sm font-bold text-velora-accent">
        <Camera className="h-4 w-4" aria-hidden />{file ? t("Choose a different photo") : t("Take or choose the selfie")}
        <input type="file" accept={ACCEPT} capture="user" className="sr-only" onChange={(event) => choose(event.target.files?.[0] || null)} />
      </label>
      {/* eslint-disable-next-line @next/next/no-img-element -- a local blob preview, never optimised */}
      {preview && <img src={preview} alt={t("Your selfie, not sent yet")} className="mx-auto max-h-80 rounded-xl object-contain" />}
      {error && <p role="alert" className="text-sm text-velora-danger">{t(error)}</p>}
      <button type="button" onClick={() => void submit()} disabled={!file || progress !== null} className="min-h-12 w-full rounded-full bg-velora-warm px-6 text-sm font-semibold text-velora-paper disabled:opacity-50">
        {progress !== null ? t("Sending… {progress}%", { progress }) : t("Send for review")}
      </button>
      <p className="text-xs leading-relaxed text-velora-textMuted">{t("Only our review team sees this photo. We normally delete it after approval, or 30 days after a refusal or retry request. A legal hold may require longer retention.")}</p>
    </section>
  </>);
}
