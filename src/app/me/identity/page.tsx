"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { AUDIENCES, DEFAULT_VISIBILITY, LIMITS, ORIENTATIONS, PRONOUN_SUGGESTIONS, type Audience, type IdentityKey } from "@/lib/identity.mjs";

type Form = { orientation: string | null; orientationNote: string; genderNote: string; pronouns: string; visibility: Record<IdentityKey, Audience> };
const EMPTY: Form = { orientation: null, orientationNote: "", genderNote: "", pronouns: "", visibility: { ...DEFAULT_VISIBILITY } };
const AUDIENCE_LABELS: Record<Audience, string> = { MEMBERS_ONLY: "Members", FRIENDS_ONLY: "Friends", PRIVATE: "Only me" };

/** FM-09 editor: optional orientation and identity details, each with its own audience. */
export default function IdentityPage() {
  const { t } = useTranslation();
  const [form, setForm] = React.useState<Form>(EMPTY);
  const [consented, setConsented] = React.useState(false);
  const [consentChecked, setConsentChecked] = React.useState(false);
  const [status, setStatus] = React.useState<"loading" | "ready" | "unavailable" | "signed-out" | "error">("loading");
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ kind: "ok" | "error"; text: string } | null>(null);

  React.useEffect(() => {
    fetch("/api/profile/identity", { credentials: "same-origin", cache: "no-store" }).then(async (response) => {
      if (response.status === 401) return setStatus("signed-out");
      if (!response.ok) return setStatus("error");
      const payload = await response.json();
      if (!payload.available) return setStatus("unavailable");
      setConsented(Boolean(payload.consent));
      setForm({
        orientation: payload.orientation ?? null,
        orientationNote: payload.orientationNote ?? "",
        genderNote: payload.genderNote ?? "",
        pronouns: payload.pronouns ?? "",
        visibility: { ...DEFAULT_VISIBILITY, ...(payload.visibility || {}) },
      });
      setStatus("ready");
    }).catch(() => setStatus("error"));
  }, []);

  const sensitive = Boolean(form.orientation || form.orientationNote.trim() || form.genderNote.trim());
  const blocked = sensitive && !consented && !consentChecked;

  async function save() {
    if (blocked) return;
    setSaving(true); setMessage(null);
    try {
      const response = await fetch("/api/profile/identity", {
        method: "PUT", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, consent: consented ? undefined : consentChecked }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ kind: "error", text: payload.error === "Links and contact details can't go here" ? "Links and contact details can't go here." : payload.error === "That's too long" ? "One of the fields is too long." : "Your details could not be saved. Please try again." });
        return;
      }
      if (sensitive) setConsented(true);
      setMessage({ kind: "ok", text: "Saved." });
    } catch {
      setMessage({ kind: "error", text: "Your details could not be saved. Please try again." });
    } finally {
      setSaving(false);
    }
  }

  const set = (patch: Partial<Form>) => { setForm((current) => ({ ...current, ...patch })); setMessage(null); };
  const setAudience = (key: IdentityKey, audience: Audience) => set({ visibility: { ...form.visibility, [key]: audience } });

  const back = <Link href="/me" className="inline-flex items-center gap-1 text-xs text-velora-textMuted hover:text-velora-textPrimary"><ArrowLeft className="h-3.5 w-3.5" aria-hidden />{t("Me")}</Link>;
  if (status === "loading") return <main className="mx-auto max-w-2xl px-4 py-10 text-sm text-velora-textMuted">{t("Loading…")}</main>;
  if (status === "signed-out") return <main className="mx-auto max-w-2xl px-4 py-10 text-sm text-velora-textSecondary"><Link href="/auth/login?returnTo=%2Fme%2Fidentity" className="text-velora-accent underline">{t("Sign in")}</Link>{" "}{t("to edit your identity details.")}</main>;
  if (status === "unavailable") return <main className="mx-auto max-w-2xl space-y-4 px-4 py-10">{back}<p className="text-sm text-velora-textSecondary">{t("Identity details are on their way. Nothing to do here yet.")}</p></main>;
  if (status === "error") return <main className="mx-auto max-w-2xl px-4 py-10 text-sm text-velora-danger">{t("We couldn't load your details. Refresh the page?")}</main>;

  const field = "mt-2 block w-full rounded-lg border border-velora-control bg-velora-paper px-4 py-3 text-base text-velora-ink placeholder:text-velora-muted focus:border-velora-accent focus:outline-none focus:ring-2 focus:ring-velora-accent/30";
  const chip = (active: boolean) => `min-h-10 rounded-full border px-4 text-sm transition ${active ? "border-velora-accent bg-velora-accent text-velora-paper font-semibold" : "border-ink/15 text-velora-ink hover:border-velora-accent"}`;
  const audiencePicker = (id: IdentityKey, value: Audience) => (
    <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label={t("Who can see this")}>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-velora-textMuted">{t("Who can see this")}</span>
      {AUDIENCES.map((audience) => (
        <button key={audience} type="button" aria-pressed={value === audience} onClick={() => setAudience(id, audience)} className={`min-h-8 rounded-full border px-3 text-xs ${value === audience ? "border-velora-accent text-velora-accent font-semibold" : "border-ink/15 text-velora-textSecondary"}`}>{t(AUDIENCE_LABELS[audience])}</button>
      ))}
    </div>
  );

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 pb-32 pt-6">
      {back}
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-velora-accent">{t("Identity")}</p>
        <h1 className="font-display font-bold text-velora-textPrimary text-5xl leading-[1.02] sm:text-6xl">{t("In your own words")}</h1>
        <p className="text-sm leading-relaxed text-velora-textSecondary">{t("All of this is optional. Share only what you want people to know, and choose who sees each part. Friends are people whose request you accepted.")}</p>
      </header>

      <section className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-4">
        <h2 className="text-sm font-bold text-velora-textPrimary">{t("Orientation")}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {ORIENTATIONS.map((item) => (
            <button key={item.value} type="button" aria-pressed={form.orientation === item.value} onClick={() => set({ orientation: form.orientation === item.value ? null : item.value })} className={chip(form.orientation === item.value)}>{t(item.label)}</button>
          ))}
        </div>
        <label className="mt-4 block text-sm font-semibold text-velora-ink">{t("Or say it your way")}
          <input value={form.orientationNote} maxLength={LIMITS.note} onChange={(event) => set({ orientationNote: event.target.value })} placeholder={t("e.g. mostly into women, still exploring")} className={field} />
        </label>
        {audiencePicker("orientation", form.visibility.orientation)}
      </section>

      <section className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-4">
        <h2 className="text-sm font-bold text-velora-textPrimary">{t("Gender, in your words")}</h2>
        <p className="mt-1 text-xs text-velora-textMuted">{t("Adds to what you chose at sign-up, for example genderfluid or trans woman.")}</p>
        <input aria-label={t("Gender, in your words")} value={form.genderNote} maxLength={LIMITS.note} onChange={(event) => set({ genderNote: event.target.value })} className={field} />
        {audiencePicker("gender_note", form.visibility.gender_note)}
      </section>

      <section className="rounded-2xl border border-ink/10 bg-ink/[0.02] p-4">
        <h2 className="text-sm font-bold text-velora-textPrimary">{t("Pronouns")}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRONOUN_SUGGESTIONS.map((pronoun) => (
            <button key={pronoun} type="button" aria-pressed={form.pronouns === pronoun} onClick={() => set({ pronouns: form.pronouns === pronoun ? "" : pronoun })} className={chip(form.pronouns === pronoun)}>{pronoun}</button>
          ))}
        </div>
        <input aria-label={t("Pronouns")} value={form.pronouns} maxLength={LIMITS.pronouns} onChange={(event) => set({ pronouns: event.target.value })} placeholder={t("or write your own")} className={field} />
        {audiencePicker("pronouns", form.visibility.pronouns)}
      </section>

      {sensitive && !consented && (
        <label className="flex cursor-pointer gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm leading-relaxed text-velora-textSecondary">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-velora-accent" checked={consentChecked} onChange={(event) => setConsentChecked(event.target.checked)} />
          <span><ShieldCheck className="mr-1 inline h-4 w-4 text-velora-success" aria-hidden />{t("I explicitly consent to Intimo storing my sexual orientation and the identity details I choose to add, and showing them only to the audience I pick. I can withdraw this at any time in Settings, which deletes them.")}</span>
        </label>
      )}

      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-ink/10 bg-velora-bg/95 px-4 py-3 backdrop-blur md:bottom-0">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <p className={`flex-1 text-xs ${message?.kind === "error" ? "text-velora-danger" : "text-velora-textSecondary"}`} role={message ? "status" : undefined}>
            {message ? t(message.text) : blocked ? t("Tick the consent box to save orientation or identity details.") : ""}
          </p>
          <button type="button" onClick={() => void save()} disabled={saving || blocked} className="min-h-11 rounded-full bg-velora-warm px-6 text-sm font-semibold text-velora-paper disabled:opacity-50">
            {saving ? t("Saving…") : t("Save")}
          </button>
        </div>
      </div>
    </main>
  );
}
