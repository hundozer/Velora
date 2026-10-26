"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { RoomDirectMessage } from "@/components/rooms/RoomDirectMessage";

type Message = { id: string; senderId: string; senderName: string; body: string; createdAt: string };
type Member = { id: string; username: string; avatarUrl: string | null };

export default function RoomsPage() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [body, setBody] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [reportId, setReportId] = React.useState<string | null>(null);
  const [reportReason, setReportReason] = React.useState("");
  const [members, setMembers] = React.useState<Member[]>([]);
  const [selected, setSelected] = React.useState<Member | null>(null);
  const [privatePeer, setPrivatePeer] = React.useState<Member | null>(null);
  const [presenceError, setPresenceError] = React.useState("");
  const load = React.useCallback(async () => {
    try { const response = await fetch("/api/rooms/prague", { cache: "no-store" }); const payload = await response.json(); if (!response.ok) throw Error(payload.error); setMessages(payload.messages || []); setError(""); }
    catch { setError("The room could not be loaded. Try again shortly."); }
    finally { setLoaded(true); }
  }, []);
  React.useEffect(() => { if (!user) return; void load(); const timer = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, 15_000); return () => window.clearInterval(timer); }, [user, load]);
  React.useEffect(() => {
    if (!user) return;
    let active = true;
    const update = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const heartbeat = await fetch("/api/rooms/prague/presence", { method: "POST" });
        if (!heartbeat.ok) throw Error("Presence unavailable");
        const r = await fetch("/api/rooms/prague/presence", { cache: "no-store" });
        if (!r.ok) throw Error("Presence unavailable");
        const p = await r.json(); if (active) { setMembers(p.members || []); setPresenceError(""); }
      } catch { if (active) setPresenceError("Online list unavailable"); }
    };
    void update();
    const timer = window.setInterval(() => void update(), 30_000);
    const visibility = () => { if (document.visibilityState === "visible") void update(); else { setMembers([]); void fetch("/api/rooms/prague/presence", { method: "DELETE", keepalive: true }); } };
    document.addEventListener("visibilitychange", visibility);
    return () => { active = false; window.clearInterval(timer); document.removeEventListener("visibilitychange", visibility); void fetch("/api/rooms/prague/presence", { method: "DELETE", keepalive: true }); };
  }, [user]);
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
  return <main className="mx-auto max-w-6xl px-5 pb-28 pt-8">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-velora-accent">Intimo rooms · 18+</p>
    <h1 className="mt-3 font-display text-5xl">Prague Room</h1>
    <p className="mt-4 max-w-xl text-velora-ink2">One shared conversation for adults in Prague. Say hello, talk about the scene, or find company. Be specific, kind and respectful of a no.</p>
    <p className="mt-3 text-sm text-velora-muted">Everyone in the room can read posts. Keep addresses, private photos and personal details in a private conversation. Blocked members are hidden from your view. Moderators can remove posts.</p>
    {!user ? <Link href="/register" className="mt-6 inline-flex min-h-11 items-center text-velora-accent underline">Join to enter the room</Link> : <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]"><div className="min-w-0">
      {error && <p role="status" className="mt-5 text-velora-accent">{error}</p>}
      <section aria-label="Room conversation" className="space-y-4">
        {loaded && !messages.length && !error && <p className="rounded-2xl border border-velora-line p-6 text-velora-ink2">It&apos;s quiet here. Start with a hello or a question for Prague.</p>}
        {messages.map(m => <article key={m.id} className="rounded-2xl border border-velora-line bg-velora-surface p-4"><div className="flex flex-wrap items-center gap-3 text-sm"><Link href={`/profile/${m.senderId}`} className="font-semibold text-velora-ink underline">{m.senderName}</Link><time className="text-velora-muted" dateTime={m.createdAt}>{new Date(m.createdAt).toLocaleString("en-GB", { timeZone: "Europe/Prague", dateStyle: "short", timeStyle: "short" })}</time></div><p className="mt-2 whitespace-pre-wrap break-words text-velora-ink">{m.body}</p><div className="mt-2 text-xs">{m.senderId === profile?.id ? <button className="min-h-11 text-velora-accent underline" onClick={() => void remove(m.id)}>Remove my post</button> : <button className="min-h-11 text-velora-muted underline" onClick={() => { setReportId(m.id); setReportReason(""); }}>Report post</button>}</div>{reportId === m.id && <form onSubmit={e => void report(m, e)} className="mt-3"><label className="block text-sm font-semibold" htmlFor={`report-${m.id}`}>Why are you reporting this post?</label><textarea id={`report-${m.id}`} value={reportReason} onChange={e => setReportReason(e.target.value)} minLength={10} maxLength={2000} required rows={2} className="mt-2 w-full rounded-xl border border-velora-control bg-velora-paper p-3" /><div className="mt-2 flex gap-4"><button className="min-h-11 text-velora-accent underline">Send report</button><button type="button" className="min-h-11 text-velora-muted underline" onClick={() => setReportId(null)}>Cancel</button></div></form>}</article>)}
      </section>
      <form onSubmit={send} className="sticky bottom-16 mt-8 rounded-2xl border border-velora-line bg-velora-paper p-4 md:bottom-0"><label className="block text-sm font-semibold">Add to the conversation<textarea value={body} onChange={e => setBody(e.target.value)} maxLength={500} rows={2} className="mt-2 w-full rounded-xl border border-velora-control bg-velora-surface p-3" placeholder="What’s happening in Prague?" /></label><button disabled={busy || !body.trim()} className="mt-2 min-h-11 rounded-full bg-velora-accent px-6 font-semibold text-velora-paper disabled:opacity-40">Post to room</button></form>
    </div><aside aria-label="Members in the room" className="rounded-2xl border border-velora-line bg-velora-surface p-4 lg:sticky lg:top-24 lg:max-h-[75vh] lg:overflow-y-auto lg:self-start"><h2 className="font-display text-2xl text-velora-ink">In the room</h2><p className="mt-1 text-xs text-velora-muted">Here now · updates every 30 seconds</p>{presenceError && <p role="status" className="mt-4 text-sm text-velora-accent">{presenceError}</p>}{!presenceError && members.length === 0 && <p className="mt-4 text-sm text-velora-muted">No visible members right now.</p>}<ul className="mt-4 space-y-1">{members.map(member => <li key={member.id}><button type="button" aria-expanded={selected?.id === member.id} onClick={() => setSelected(selected?.id === member.id ? null : member)} className="flex min-h-11 w-full items-center gap-2 rounded-xl px-2 text-left text-velora-ink hover:bg-velora-paper"><span className="h-2 w-2 rounded-full bg-green-500" aria-hidden /><span className="truncate">{member.username}</span>{member.id === profile?.id && <span className="text-xs text-velora-muted">(you)</span>}</button>{selected?.id === member.id && member.id !== profile?.id && <div className="ml-4 flex gap-4 text-sm"><a href={`/profile/${member.id}`} target="_blank" rel="noopener noreferrer" className="min-h-11 content-center text-velora-accent underline">View profile</a><button type="button" onClick={() => { setPrivatePeer(member); setSelected(null); }} className="min-h-11 text-velora-accent underline">Message</button></div>}</li>)}</ul></aside>{privatePeer && <RoomDirectMessage key={privatePeer.id} peer={privatePeer} selfId={profile?.id} onClose={() => setPrivatePeer(null)} />}</div>}
  </main>;
}
