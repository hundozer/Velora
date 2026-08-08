"use client";

import React from "react";

type MediaItem = {
  id: string; owner_id: string; media_type: string; mime_type: string; byte_size: number;
  visibility: string; upload_status: string; processing_status: string; moderation_status: string;
  title?: string | null; description?: string | null; category?: string | null; created_at: string;
};

export function AdminMediaConsole() {
  const [items, setItems] = React.useState<MediaItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [reasonById, setReasonById] = React.useState<Record<string, string>>({});
  const load = React.useCallback(() => {
    setLoading(true);
    fetch("/api/admin/media", { credentials: "same-origin" }).then(async (response) => {
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Content queue unavailable");
      setItems(payload.media || []); setError("");
    }).catch((cause) => setError(cause.message || "Content queue unavailable")).finally(() => setLoading(false));
  }, []);
  React.useEffect(load, [load]);

  async function decide(item: MediaItem, decision: string) {
    const reason = (reasonById[item.id] || "").trim();
    if (reason.length < 10) { setError("Enter a specific reason of at least 10 characters before deciding."); return; }
    const destructive = decision === "REJECTED" || decision === "REMOVED";
    const response = await fetch("/api/admin/media", { method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, decision, reason, confirmation: destructive ? `CONFIRM ${decision}` : undefined }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setError(payload.error || "Decision failed"); return; }
    setError(""); load();
  }

  if (loading) return <p>Loading durable media queue…</p>;
  return <div className="space-y-4">{error && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}{items.length === 0 && <p className="rounded-xl border bg-white p-5">No uploaded media exists.</p>}{items.map((item) => <article key={item.id} className="rounded-xl border bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.media_type} · {item.mime_type} · {Math.ceil(item.byte_size / 1024)} KB</p><h2 className="mt-1 font-bold">{item.title || "Untitled media"}</h2><p className="mt-1 max-w-2xl text-sm text-slate-600">{item.description || "No description supplied."}</p><p className="mt-2 font-mono text-[11px] text-slate-500">Media {item.id} · Owner {item.owner_id}</p></div><div className="text-right text-xs"><strong>{item.moderation_status}</strong><p>{item.upload_status} · {item.processing_status}</p><p>{item.visibility}</p></div></div><label className="mt-4 block text-xs font-semibold" htmlFor={`reason-${item.id}`}>Auditable decision reason</label><textarea id={`reason-${item.id}`} value={reasonById[item.id] || ""} onChange={(event) => setReasonById((current) => ({ ...current, [item.id]: event.target.value }))} className="mt-1 min-h-20 w-full rounded-lg border border-slate-300 p-2 text-sm" placeholder="State the policy basis and relevant evidence. Do not include unnecessary identity data." /><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => decide(item, "UNDER_REVIEW")} className="rounded-lg border px-3 py-2 text-xs font-bold">Start review</button><button onClick={() => decide(item, "APPROVED")} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white">Approve and publish</button><button onClick={() => decide(item, "HIDDEN")} className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white">Hide</button><button onClick={() => decide(item, "REJECTED")} className="rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white">Reject upload</button><button onClick={() => decide(item, "REMOVED")} className="rounded-lg border border-red-700 px-3 py-2 text-xs font-bold text-red-800">Remove published media</button></div></article>)}</div>;
}
