"use client";
import React from "react";
import Link from "next/link";
import { AREAS } from "@/lib/areas.mjs";

type Night = { id: string; title: string; starts_at: string; status: string; host_id: string };
export default function GuestListAdmin() {
  const [nights, setNights] = React.useState<Night[]>([]);
  const [error, setError] = React.useState("");
  const [form, setForm] = React.useState({ hostId: "", title: "", description: "", startsAt: "", endsAt: "", areaId: "", capacity: 6, exactAddress: "", confirmedHostParticipation: false });
  const [busy, setBusy] = React.useState(false);
  const load = React.useCallback(async () => {
    const r = await fetch("/api/admin/guest-list", { cache: "no-store" });
    const d = await r.json(); if (!r.ok) throw Error(d.error || "Guest List unavailable"); setNights(d.nights || []);
  }, []);
  React.useEffect(() => { void load().catch(e => setError(e.message)); }, [load]);
  async function publish(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const r = await fetch("/api/admin/guest-list", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, startsAt: new Date(form.startsAt).toISOString(), endsAt: new Date(form.endsAt).toISOString() }) });
      const d = await r.json(); if (!r.ok) throw Error(d.error || "Could not publish");
      setForm({ hostId: "", title: "", description: "", startsAt: "", endsAt: "", areaId: "", capacity: 6, exactAddress: "", confirmedHostParticipation: false }); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not publish"); } finally { setBusy(false); }
  }
  async function cancel(id: string) {
    if (!confirm("Cancel this Guest List? Accepted guests lose address access immediately.")) return;
    setBusy(true); try { const r = await fetch("/api/admin/guest-list", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "CANCELLED" }) }); if (!r.ok) throw Error("Could not cancel"); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not cancel"); } finally { setBusy(false); }
  }
  async function purge(id: string) {
    if (!confirm("Permanently remove this ended gathering, its private address and all requests?")) return;
    setBusy(true); try { const r = await fetch(`/api/admin/guest-list?id=${encodeURIComponent(id)}`, { method: "DELETE" }); if (!r.ok) throw Error("Could not remove ended gathering"); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not remove"); } finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-2xl px-5 py-8"><Link href="/admin" className="underline">Back to admin</Link><h1 className="mt-5 font-display text-4xl">Guest List pilot</h1><p className="mt-3 text-sm">Publish only after confirming a real host and gathering. The address stays private until a host accepts a guest. No sample listings.</p>{error && <p role="alert" className="mt-4 text-velora-crimson">{error}</p>}
    <form onSubmit={publish} className="mt-8 space-y-4">{(["hostId", "title", "description", "exactAddress"] as const).map(field => <label key={field} className="block text-sm font-semibold">{field === "exactAddress" ? "Private meeting address" : field === "hostId" ? "Confirmed host profile UUID" : field === "description" ? "Public description" : "Title"}<input value={form[field]} required onChange={e => setForm(v => ({ ...v, [field]: e.target.value }))} className="mt-2 min-h-12 w-full rounded-xl border border-velora-line bg-velora-sunken p-3"/></label>)}
      <p className="text-xs text-velora-muted">The description is visible to eligible members. Never put the exact address there.</p>
      <label className="block text-sm">Starts (your device time zone)<input type="datetime-local" required value={form.startsAt} onChange={e => setForm(v => ({ ...v, startsAt: e.target.value }))} className="mt-2 min-h-12 w-full rounded-xl border border-velora-line bg-velora-sunken p-3"/></label>
      <label className="block text-sm">Ends (your device time zone)<input type="datetime-local" required value={form.endsAt} onChange={e => setForm(v => ({ ...v, endsAt: e.target.value }))} className="mt-2 min-h-12 w-full rounded-xl border border-velora-line bg-velora-sunken p-3"/></label>
      <label className="block">Neighbourhood<select required value={form.areaId} onChange={e => setForm(v => ({ ...v, areaId: e.target.value }))} className="mt-2 min-h-12 w-full rounded-xl border border-velora-line bg-velora-sunken p-3"><option value="">Choose area</option>{AREAS.filter(a => a.kind === "PRAGUE_DISTRICT" || a.kind === "NEAR_PRAGUE").map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
      <label className="block">Guest limit (2–12)<input type="number" min={2} max={12} required value={form.capacity} onChange={e => setForm(v => ({ ...v, capacity: Number(e.target.value) }))} className="mt-2 min-h-12 w-full rounded-xl border border-velora-line bg-velora-sunken p-3"/></label>
      <label className="flex gap-3"><input type="checkbox" required checked={form.confirmedHostParticipation} onChange={e => setForm(v => ({ ...v, confirmedHostParticipation: e.target.checked }))}/>I confirmed this adult host agreed to run this real gathering.</label>
      <button disabled={busy} className="min-h-12 rounded-full bg-velora-accent px-6 font-semibold text-velora-paper disabled:opacity-40">Publish Guest List</button>
    </form>
    <h2 className="mt-12 font-display text-3xl">Recent listings</h2><ul className="mt-4 space-y-4">{nights.map(n => <li key={n.id} className="border-t border-velora-line py-3"><strong>{n.title}</strong> · {n.status} · {new Date(n.starts_at).toLocaleString("en-GB", { timeZone: "Europe/Prague" })}{n.status === "PUBLISHED" && <button disabled={busy} onClick={() => void cancel(n.id)} className="ml-4 min-h-11 text-velora-crimson underline">Cancel</button>}{Date.parse(n.starts_at) < Date.now() - 86400_000 && <button disabled={busy} onClick={() => void purge(n.id)} className="ml-4 min-h-11 text-velora-crimson underline">Purge if ended</button>}</li>)}</ul>
  </main>;
}
