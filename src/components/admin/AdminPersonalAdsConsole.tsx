"use client";
import React from "react";
import { categoryLabel } from "@/lib/personalAds.mjs";

type Ad = { id: string; author_id: string; category: string; title: string; body: string; boundaries: string; area_id: string | null; created_at: string };
export function AdminPersonalAdsConsole() {
  const [ads, setAds] = React.useState<Ad[]>([]);
  const [reason, setReason] = React.useState<Record<string, string>>({});
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const load = React.useCallback(async () => {
    const response = await fetch("/api/admin/personal-ads", { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return setError(payload.error || "Live ads unavailable");
    setError(""); setAds(payload.ads || []);
  }, []);
  React.useEffect(() => { void load(); }, [load]);
  async function remove(id: string) {
    if ((reason[id] || "").trim().length < 10) { setError("To remove an ad, write a reason of at least 10 characters."); return; }
    const response = await fetch("/api/admin/personal-ads", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, decision: "REJECTED", reason: reason[id] }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return setError(payload.error || "Decision failed; refresh before retrying");
    setNotice(payload.notificationWarning || "Ad removed. The author was notified."); void load();
  }
  return <section className="mt-8 space-y-4"><h2 className="font-display text-3xl">Live dating ads</h2><p className="text-sm text-velora-ink2">Dating ads appear immediately for verified adult members. Remove posts offering paid services, contact details, minors, coercion or non-consensual content. Explicit adult language remains allowed.</p>
    {error && <p role="alert" className="text-velora-danger">{error}</p>}{notice && <p role="status">{notice}</p>}
    {!ads.length && <p className="text-sm text-velora-muted">No live ads.</p>}
    {ads.map(ad => <article key={ad.id} className="rounded-xl border border-velora-line bg-velora-surface p-5"><p className="text-xs text-velora-muted">{categoryLabel(ad.category)} · {ad.area_id || "No area"} · {new Date(ad.created_at).toLocaleString()}</p><h3 className="mt-2 text-xl font-bold">{ad.title}</h3><p className="mt-2 whitespace-pre-wrap">{ad.body}</p><p className="mt-3 text-sm"><strong>Off-limits:</strong> {ad.boundaries}</p><p className="mt-2 font-mono text-xs">Author {ad.author_id} · Ad {ad.id}</p><label className="mt-4 block text-sm">Removal reason (shown to the author)<input value={reason[ad.id] || ""} onChange={event => setReason(current => ({ ...current, [ad.id]: event.target.value }))} className="mt-1 w-full rounded border border-velora-control bg-velora-paper p-2" /></label><div className="mt-3 flex gap-3"><button onClick={() => remove(ad.id)} className="min-h-11 border border-velora-danger px-4 py-2 text-velora-danger">Remove ad</button></div></article>)}
  </section>;
}
