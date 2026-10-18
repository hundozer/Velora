"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { DESIRES, DESIRE_CATEGORIES, DESIRE_STATES, defaultVisibility, type DesireState, type DesireVisibility } from "@/lib/desires.mjs";

type Selection = { state: DesireState; visibility: DesireVisibility };

const STATE_STYLE: Record<DesireState, string> = {
  LOVE: "border-velora-gold bg-velora-gold/20 text-velora-textPrimary",
  INTO: "border-velora-gold/70 bg-velora-gold/10 text-velora-textPrimary",
  CURIOUS: "border-ink/40 bg-ink/10 text-velora-textPrimary",
  NOT_FOR_ME: "border-ink/25 bg-ink/5 text-velora-textSecondary",
  HARD_LIMIT: "border-red-400/60 bg-red-500/10 text-red-700",
};

/** Desire Graph editor (P1-19): five states per desire, members-visible unless hidden. */
export default function DesiresPage() {
  const [selections, setSelections] = React.useState<Record<string, Selection>>({});
  const [consented, setConsented] = React.useState(false);
  const [consentChecked, setConsentChecked] = React.useState(false);
  const [status, setStatus] = React.useState<"loading" | "ready" | "signed-out" | "error">("loading");
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ kind: "ok" | "error"; text: string } | null>(null);

  React.useEffect(() => {
    fetch("/api/desires/me", { credentials: "same-origin", cache: "no-store" }).then(async (response) => {
      if (response.status === 401) return setStatus("signed-out");
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) return setStatus("error");
      setConsented(Boolean(payload.consent));
      setSelections(Object.fromEntries((payload.selections || []).map((row: { desire_id: string; state: DesireState; visibility: DesireVisibility }) => [row.desire_id, { state: row.state, visibility: row.visibility }])));
      setStatus("ready");
    }).catch(() => setStatus("error"));
  }, []);

  function choose(desireId: string, state: DesireState) {
    setMessage(null);
    setSelections((current) => {
      const next = { ...current };
      if (next[desireId]?.state === state) delete next[desireId];
      else next[desireId] = { state, visibility: state === "NOT_FOR_ME" ? "PRIVATE" : next[desireId]?.visibility === "PRIVATE" ? "PRIVATE" : defaultVisibility(state) };
      return next;
    });
  }

  function toggleVisibility(desireId: string) {
    setMessage(null);
    setSelections((current) => ({ ...current, [desireId]: { ...current[desireId], visibility: current[desireId].visibility === "PRIVATE" ? "MEMBERS" : "PRIVATE" } }));
  }

  async function save() {
    if (!consented && !consentChecked) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/desires/me", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consent: consented ? undefined : consentChecked,
          selections: Object.entries(selections).map(([desireId, selection]) => ({ desireId, ...selection })),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Your desires could not be saved.");
      setConsented(true);
      setMessage({ kind: "ok", text: "Saved. Members see your visible desires on your profile." });
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Your desires could not be saved." });
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") return <main className="mx-auto max-w-2xl px-4 py-10 text-sm text-velora-textMuted">Loading…</main>;
  if (status === "signed-out") return <main className="mx-auto max-w-2xl px-4 py-10 text-sm text-velora-textSecondary"><Link href="/auth/login?returnTo=%2Fme%2Fdesires" className="text-velora-gold underline">Sign in</Link> to set your desires.</main>;
  if (status === "error") return <main className="mx-auto max-w-2xl px-4 py-10 text-sm text-red-700">Your desires could not be loaded. Please refresh.</main>;

  const count = Object.keys(selections).length;
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 pb-32 pt-6">
      <Link href="/me" className="inline-flex items-center gap-1 text-xs text-velora-textMuted hover:text-velora-textPrimary"><ArrowLeft className="h-3.5 w-3.5" aria-hidden />Me</Link>
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-velora-gold">Desires</p>
        <h1 className="font-serif font-bold text-velora-textPrimary text-5xl leading-[1.02] sm:text-6xl">What you&apos;re into</h1>
        <p className="text-sm leading-relaxed text-velora-textSecondary">Mark only what you want to. Members see shared desires first. Hard limits are shown so nobody has to guess; &ldquo;Not for me&rdquo; is always private.</p>
      </header>

      {!consented && (
        <label className="flex cursor-pointer gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm leading-relaxed text-velora-textSecondary">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-velora-gold" checked={consentChecked} onChange={(event) => setConsentChecked(event.target.checked)} />
          <span><ShieldCheck className="mr-1 inline h-4 w-4 text-emerald-700" aria-hidden />I explicitly consent to Intimo storing my desires and showing the visible ones to signed-in members. I can withdraw this in Privacy settings, which erases them.</span>
        </label>
      )}

      {DESIRE_CATEGORIES.map((category) => (
        <section key={category.id} className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-velora-textSecondary">{category.label}</h2>
          <ul className="divide-y divide-ink/5 overflow-hidden rounded-2xl border border-ink/10 bg-ink/[0.02]">
            {DESIRES.filter((desire) => desire.category === category.id).map((desire) => {
              const selection = selections[desire.id];
              return (
                <li key={desire.id} className="space-y-2 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-velora-textPrimary">{desire.label}</span>
                    {selection && selection.state !== "NOT_FOR_ME" && (
                      <button type="button" onClick={() => toggleVisibility(desire.id)} aria-label={selection.visibility === "PRIVATE" ? `Show ${desire.label} to members` : `Hide ${desire.label} from members`} className="inline-flex min-h-9 items-center gap-1 rounded-full px-2 text-[11px] text-velora-textMuted hover:text-velora-textPrimary">
                        {selection.visibility === "PRIVATE" ? <><EyeOff className="h-3.5 w-3.5" aria-hidden />Private</> : <><Eye className="h-3.5 w-3.5" aria-hidden />Members</>}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5" role="group" aria-label={desire.label}>
                    {DESIRE_STATES.map((state) => {
                      const active = selection?.state === state.value;
                      return (
                        <button key={state.value} type="button" aria-pressed={active} onClick={() => choose(desire.id, state.value)} className={`min-h-9 rounded-full border px-3 text-xs transition ${active ? STATE_STYLE[state.value] : "border-ink/10 text-velora-textMuted hover:border-ink/25"}`}>
                          {state.label}
                        </button>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-ink/10 bg-velora-bg/95 px-4 py-3 backdrop-blur md:bottom-0">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <p className={`flex-1 text-xs ${message?.kind === "error" ? "text-red-700" : "text-velora-textSecondary"}`} role={message ? "status" : undefined}>
            {message ? message.text : `${count} selected`}
          </p>
          <button type="button" onClick={save} disabled={saving || (!consented && !consentChecked)} className="min-h-11 rounded-full bg-gold-gradient px-6 text-sm font-bold text-velora-bg disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </main>
  );
}
