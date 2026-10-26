"use client";
import React from "react";
import Link from "next/link";

type Message = { id: string; sender_id: string; body: string; status: string; created_at: string };
export function AdminRoomConsole() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [reason, setReason] = React.useState<Record<string, string>>({});
  const [error, setError] = React.useState("");
  const load = React.useCallback(async () => { const r = await fetch("/api/admin/rooms/prague", { cache: "no-store" }); const p = await r.json(); if (r.ok) setMessages(p.messages || []); else setError(p.error || "Room unavailable"); }, []);
  React.useEffect(() => { void load(); }, [load]);
  async function remove(id: string) {
    const r = await fetch("/api/admin/rooms/prague", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, reason: reason[id] }) });
    const p = await r.json(); if (!r.ok) setError(p.error || "Removal failed"); else { setError(""); await load(); }
  }
  return <section className="space-y-4"><h2 className="font-display text-3xl">Prague Room moderation</h2><p className="text-sm text-velora-ink2">Review recent posts and remove a message with an auditable reason. Member reports also enter the moderation inbox.</p>{error && <p role="alert" className="text-velora-danger">{error}</p>}{!messages.length && <p>No room posts yet.</p>}{messages.map(m => <article key={m.id} className="rounded-xl border border-velora-line p-4"><p className="text-xs text-velora-muted">{new Date(m.created_at).toLocaleString()} · {m.status}</p><Link href={`/admin/users?q=${encodeURIComponent(m.sender_id)}`} className="text-sm underline">Member {m.sender_id}</Link><p className="mt-2 whitespace-pre-wrap break-words">{m.body}</p>{m.status === "VISIBLE" && <div className="mt-3"><label className="block text-sm">Removal reason<input value={reason[m.id] || ""} onChange={e => setReason(v => ({ ...v, [m.id]: e.target.value }))} maxLength={500} className="mt-1 block w-full rounded-lg border border-velora-control bg-velora-surface p-2" /></label><button disabled={(reason[m.id] || "").trim().length < 10} onClick={() => void remove(m.id)} className="mt-2 min-h-11 text-velora-danger underline disabled:opacity-40">Remove post</button></div>}</article>)}</section>;
}
