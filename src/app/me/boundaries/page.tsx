"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BOUNDARY_GROUPS, BOUNDARY_KINDS, BOUNDARY_PREFERENCES, type BoundaryPreference } from "@/lib/boundaries.mjs";

const PREFERENCE_STYLE: Record<BoundaryPreference, string> = {
  COMFORTABLE: "border-emerald-400/60 bg-emerald-400/10 text-velora-textPrimary",
  ASK_FIRST: "border-velora-gold bg-velora-gold/15 text-velora-textPrimary",
  NOT_INTERESTED: "border-red-400/60 bg-red-500/10 text-velora-danger",
};

/** Boundaries & approach preferences editor (P1-20). Enforced server-side where marked. */
export default function BoundariesPage() {
  const [values, setValues] = React.useState<Record<string, BoundaryPreference>>({});
  const [status, setStatus] = React.useState<"loading" | "ready" | "signed-out" | "error">("loading");
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);
  const [message, setMessage] = React.useState<{ kind: "ok" | "error"; text: string } | null>(null);

  React.useEffect(() => {
    fetch("/api/boundaries/me", { credentials: "same-origin", cache: "no-store" }).then(async (response) => {
      if (response.status === 401) return setStatus("signed-out");
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) return setStatus("error");
      setValues(payload.boundaries || {});
      setStatus("ready");
    }).catch(() => setStatus("error"));
  }, []);

  function choose(kind: string, preference: BoundaryPreference) {
    setValues((current) => ({ ...current, [kind]: preference }));
    setDirty(true);
    setMessage(null);
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/boundaries/me", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boundaries: Object.entries(values).map(([kind, preference]) => ({ kind, preference })) }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Your boundaries could not be saved.");
      setValues(payload.boundaries || values);
      setDirty(false);
      setMessage({ kind: "ok", text: "Saved. These apply right away." });
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Your boundaries could not be saved." });
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") return <main className="mx-auto max-w-2xl px-4 py-10 text-sm text-velora-textMuted">Loading…</main>;
  if (status === "signed-out") return <main className="mx-auto max-w-2xl px-4 py-10 text-sm text-velora-textSecondary"><Link href="/auth/login?returnTo=%2Fme%2Fboundaries" className="text-velora-gold underline">Sign in</Link> to set your boundaries.</main>;
  if (status === "error") return <main className="mx-auto max-w-2xl px-4 py-10 text-sm text-velora-danger">Your boundaries could not be loaded. Please refresh.</main>;

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 pb-32 pt-6">
      <Link href="/me" className="inline-flex items-center gap-1 text-xs text-velora-textMuted hover:text-velora-textPrimary"><ArrowLeft className="h-3.5 w-3.5" aria-hidden />Me</Link>
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-velora-gold">Boundaries</p>
        <h1 className="font-display font-bold text-velora-textPrimary text-5xl leading-[1.02] sm:text-6xl">How to approach you</h1>
        <p className="text-sm leading-relaxed text-velora-textSecondary">Members see these on your profile. &ldquo;Not interested&rdquo; on first messages and photos is enforced, so the message or request can&apos;t be sent.</p>
      </header>

      {BOUNDARY_GROUPS.map((group) => (
        <section key={group.id} className="space-y-3">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-velora-textSecondary">{group.label}</h2>
            {group.hint && <p className="mt-1 text-[11px] text-velora-textMuted">{group.hint}</p>}
          </div>
          <ul className="divide-y divide-ink/5 overflow-hidden rounded-2xl border border-ink/10 bg-ink/[0.02]">
            {BOUNDARY_KINDS.filter((kind) => kind.group === group.id).map((kind) => (
              <li key={kind.id} className="space-y-2 px-4 py-3">
                <span className="text-sm font-semibold text-velora-textPrimary">{kind.label}</span>
                <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={kind.label}>
                  {BOUNDARY_PREFERENCES.map((preference) => {
                    const active = values[kind.id] === preference.value;
                    return (
                      <button key={preference.value} type="button" role="radio" aria-checked={active} onClick={() => choose(kind.id, preference.value)} className={`min-h-9 rounded-full border px-3 text-xs transition ${active ? PREFERENCE_STYLE[preference.value] : "border-ink/10 text-velora-textMuted hover:border-ink/25"}`}>
                        {preference.label}
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="text-xs text-velora-textMuted">Who can message you at all is in <Link href="/settings" className="text-velora-gold underline">Settings → Privacy</Link>.</p>

      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-ink/10 bg-velora-bg/95 px-4 py-3 backdrop-blur md:bottom-0">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <p className={`flex-1 text-xs ${message?.kind === "error" ? "text-velora-danger" : "text-velora-textSecondary"}`} role={message ? "status" : undefined}>
            {message ? message.text : dirty ? "Unsaved changes" : "Up to date"}
          </p>
          <button type="button" onClick={save} disabled={saving || !dirty} className="min-h-11 rounded-full bg-gold-gradient px-6 text-sm font-bold text-velora-bg disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </main>
  );
}
