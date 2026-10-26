"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

type Message = { id: string; senderId: string; senderName: string; body: string; createdAt: string };

export default function RoomsPage() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [body, setBody] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [reportId, setReportId] = React.useState<string | null>(null);
  const [reportReason, setReportReason] = React.useState("");
  const load = React.useCallback(async () => {
    try { const response = await fetch("/api/rooms/prague", { cache: "no-store" }); const payload = await response.json(); if (!response.ok) throw Error(payload.error); setMessages(payload.messages || []); setError(""); }
    catch { setError("The room could not be loaded. Try again shortly."); }
    finally { setLoaded(true); }
  }, []);
  React.useEffect(() => { if (!user) return; void load(); const timer = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, 15_000); return () => window.clearInterval(timer); }, [user, load]);
  async function send(e: React.FormEvent) {
    e.preventDefault(); if (!body.trim() || busy) return; setBusy(true);
    try { const r = await fetch("/api/rooms/prague", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) }); const p = await r.json(); if (!r.ok) throw Error(p.error); setBody(""); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not post"); }
    finally { setBusy(false); }
  }
  async function remove(id: string) {
    const r = await fetch(`/api/rooms/prague?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (r.ok) await load(); else setError("Could not remove your message.");
  }
  async function report(m: Message, e: React.FormEvent) {
    e.preventDefault();
    if (reportReason.trim().length < 10) return;
    const r = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contentType: "COMMUNITY", contentId: m.id, reportedUserId: m.senderId, reason: "OTHER", description: reportReason.trim() }) });
    if (r.ok) { setReportId(null); setReportReason(""); }
    setError(r.ok ? "Report sent to moderators." : "Report could not be sent. Please try again.");
  }
  return <main className="mx-auto max-w-3xl px-5 pb-28 pt-8">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-velora-accent">Intimo rooms · 18+</p>
    <h1 className="mt-3 font-display text-5xl">Prague Room</h1>
    <p className="mt-4 max-w-xl text-velora-ink2">One shared conversation for adults in Prague. Say hello, talk about the scene, or find company. Be specific, kind and respectful of a no.</p>
    <p className="mt-3 text-sm text-velora-muted">Everyone in the room can read posts. Keep addresses, private photos and personal details in a private conversation. Blocked members are hidden from your view. Moderators can remove posts.</p>
    {!user ? <Link href="/register" className="mt-6 inline-flex min-h-11 items-center text-velora-accent underline">Join to enter the room</Link> : <>
      {error && <p role="status" className="mt-5 text-velora-accent">{error}</p>}
      <section aria-label="Room conversation" className="mt-8 space-y-4">
        {loaded && !messages.length && !error && <p className="rounded-2xl border border-velora-line p-6 text-velora-ink2">It&apos;s quiet here. Start with a hello or a question for Prague.</p>}
        {messages.map(m => <article key={m.id} className="rounded-2xl border border-velora-line bg-velora-surface p-4"><div className="flex flex-wrap items-center gap-3 text-sm"><Link href={`/profile/${m.senderId}`} className="font-semibold text-velora-ink underline">{m.senderName}</Link><time className="text-velora-muted" dateTime={m.createdAt}>{new Date(m.createdAt).toLocaleString("en-GB", { timeZone: "Europe/Prague", dateStyle: "short", timeStyle: "short" })}</time></div><p className="mt-2 whitespace-pre-wrap break-words text-velora-ink">{m.body}</p><div className="mt-2 text-xs">{m.senderId === profile?.id ? <button className="min-h-11 text-velora-accent underline" onClick={() => void remove(m.id)}>Remove my post</button> : <button className="min-h-11 text-velora-muted underline" onClick={() => { setReportId(m.id); setReportReason(""); }}>Report post</button>}</div>{reportId === m.id && <form onSubmit={e => void report(m, e)} className="mt-3"><label className="block text-sm font-semibold" htmlFor={`report-${m.id}`}>Why are you reporting this post?</label><textarea id={`report-${m.id}`} value={reportReason} onChange={e => setReportReason(e.target.value)} minLength={10} maxLength={2000} required rows={2} className="mt-2 w-full rounded-xl border border-velora-control bg-velora-paper p-3" /><div className="mt-2 flex gap-4"><button className="min-h-11 text-velora-accent underline">Send report</button><button type="button" className="min-h-11 text-velora-muted underline" onClick={() => setReportId(null)}>Cancel</button></div></form>}</article>)}
      </section>
      <form onSubmit={send} className="sticky bottom-16 mt-8 rounded-2xl border border-velora-line bg-velora-paper p-4 md:bottom-0"><label className="block text-sm font-semibold">Add to the conversation<textarea value={body} onChange={e => setBody(e.target.value)} maxLength={500} rows={2} className="mt-2 w-full rounded-xl border border-velora-control bg-velora-surface p-3" placeholder="What’s happening in Prague?" /></label><button disabled={busy || !body.trim()} className="mt-2 min-h-11 rounded-full bg-velora-accent px-6 font-semibold text-velora-paper disabled:opacity-40">Post to room</button></form>
    </>}
  </main>;
}
