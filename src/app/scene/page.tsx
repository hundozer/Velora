"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { SceneEventCard, type SceneEvent } from "@/components/scene/SceneEventCard";
import { AreaSelect } from "@/components/profile/AreaSelect";
import { SCENE_KINDS } from "@/lib/scene.mjs";

const field = "w-full rounded-2xl border border-ink/10 bg-ink/5 px-4 py-3 text-sm text-velora-textPrimary outline-none focus:border-velora-gold/60";

/** Prague Scene (P1-21): real sex-positive events, curated by the Intimo team. */
export default function ScenePage() {
  const { user } = useAuth();
  const [events, setEvents] = React.useState<SceneEvent[] | null>(null);
  const [suggesting, setSuggesting] = React.useState(false);
  const [form, setForm] = React.useState({ title: "", kind: "", startsAt: "", venueName: "", areaId: "", organiser: "", description: "", url: "" });
  const [message, setMessage] = React.useState<{ ok: boolean; text: string } | null>(null);

  React.useEffect(() => {
    fetch("/api/scene", { cache: "no-store" }).then((response) => (response.ok ? response.json() : { events: [] })).then((payload) => setEvents(payload.events || [])).catch(() => setEvents([]));
  }, []);

  async function suggest(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    const response = await fetch("/api/scene", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : "" }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return setMessage({ ok: false, text: payload.error || "Your suggestion could not be sent." });
    setMessage({ ok: true, text: "Thanks! We'll check it and publish it if it fits." });
    setForm({ title: "", kind: "", startsAt: "", venueName: "", areaId: "", organiser: "", description: "", url: "" });
    setSuggesting(false);
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 pb-24 pt-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-velora-gold">Prague Scene</p>
          <h1 className="font-serif font-bold text-velora-textPrimary text-5xl leading-[1.02] sm:text-6xl">Out in the city</h1>
          <p className="mt-1 text-sm text-velora-textSecondary">Munches, workshops and parties run by Prague&apos;s sex-positive community. Hand-picked by us; booking is with the organiser.</p>
        </div>
        {user && !suggesting && <button type="button" onClick={() => setSuggesting(true)} className="min-h-11 shrink-0 rounded-full border border-ink/15 px-4 text-sm font-semibold text-velora-textPrimary hover:border-velora-gold/50">Suggest</button>}
      </header>

      {message && <p role="status" className={`rounded-2xl border p-4 text-sm ${message.ok ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-700" : "border-red-500/40 bg-red-500/10 text-red-700"}`}>{message.text}</p>}

      {suggesting && (
        <form onSubmit={suggest} className="space-y-3 rounded-3xl border border-ink/10 bg-ink/[0.02] p-5">
          <h2 className="font-semibold text-velora-textPrimary">Suggest a listing</h2>
          <input className={field} placeholder="Event name" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} />
          <select className={field} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}><option value="">What kind of event</option>{SCENE_KINDS.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}</select>
          <input className={field} type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} aria-label="Starts" />
          <input className={field} placeholder="Organiser" value={form.organiser} onChange={(e) => setForm({ ...form, organiser: e.target.value })} maxLength={120} />
          <input className={field} placeholder="Venue (optional)" value={form.venueName} onChange={(e) => setForm({ ...form, venueName: e.target.value })} maxLength={120} />
          <AreaSelect className={field} value={form.areaId} onChange={(areaId) => setForm({ ...form, areaId })} />
          <input className={field} placeholder="https:// link to the organiser's page" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          <textarea className={`${field} min-h-20`} placeholder="Short description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={600} />
          <div className="flex gap-3"><button type="button" onClick={() => setSuggesting(false)} className="min-h-11 flex-1 rounded-full border border-ink/15 text-sm text-velora-textSecondary">Cancel</button><button type="submit" className="min-h-11 flex-1 rounded-full bg-gold-gradient text-sm font-bold text-velora-bg">Send for review</button></div>
        </form>
      )}

      {events === null ? <p className="text-sm text-velora-textMuted">Loading…</p> : events.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-ink/15 p-8 text-center">
          <h2 className="font-serif text-3xl font-bold text-velora-textPrimary">New listings coming soon</h2>
          <p className="mt-2 text-sm text-velora-textSecondary">Know a good munch, workshop or party in Prague? {user ? "Suggest it above." : "Sign in to suggest it."}</p>
        </div>
      ) : <div className="space-y-4">{events.map((event) => <SceneEventCard key={event.id} event={event} />)}</div>}
    </main>
  );
}
