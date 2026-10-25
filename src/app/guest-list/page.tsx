"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

type Guest = { id: string; status: string; pitch: string; applicantName: string; applicantId: string };
type Night = { id: string; title: string; description: string; hostName: string; hostId: string; areaName: string; startsAt: string; endsAt: string; capacity: number; isHost: boolean; address: string | null; myRequest: { id: string; status: string } | null; requests?: Guest[] };
const date = new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: "Europe/Prague" });

export default function GuestListPage() {
  const { user } = useAuth();
  const [nights, setNights] = React.useState<Night[] | null>(null);
  const [pitch, setPitch] = React.useState<Record<string, string>>({});
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const load = React.useCallback(async () => {
    try { const response = await fetch("/api/guest-list", { cache: "no-store" }); const data = await response.json(); if (!response.ok) throw Error(data.error); setNights(data.nights || []); setError(""); }
    catch { setError("Guest Lists could not be loaded. Please try again."); setNights([]); }
  }, []);
  React.useEffect(() => { if (user) void load(); }, [user, load]);
  async function action(method: string, body?: unknown, requestId?: string) {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/guest-list${requestId ? `?requestId=${encodeURIComponent(requestId)}` : ""}`, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      const result = await response.json(); if (!response.ok) throw Error(result.error || "Action unavailable");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Action unavailable"); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-3xl px-5 pb-28 pt-8">
    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-velora-accent">Prague · Guest List</p>
    <h1 className="mt-3 font-display text-5xl leading-none">A place at the table.</h1>
    <p className="mt-4 max-w-xl text-velora-ink2">Small, real gatherings with a host. Tell them why you&apos;d like to join. Only accepted guests receive the meeting address.</p>
    {!user && <p className="mt-6"><Link href="/register" className="text-velora-accent underline">Join Intimo to see Guest Lists</Link></p>}
    {error && <p role="alert" className="mt-6 text-velora-crimson">{error}</p>}
    {user && nights === null && <p role="status" className="mt-10">Looking for gatherings…</p>}
    {user && nights?.length === 0 && <section className="mt-10 rounded-2xl border border-velora-line p-6"><h2 className="font-display text-3xl">The next Guest List is taking shape.</h2><p className="mt-3 text-velora-ink2">We only list confirmed hosts and real gatherings. For now, explore Prague&apos;s published Scene events.</p><Link href="/scene" className="mt-5 inline-flex min-h-11 items-center text-velora-accent underline">Explore the Scene</Link></section>}
    <div className="mt-8 space-y-8">{nights?.map(n => <article key={n.id} className="rounded-2xl border border-velora-line bg-velora-surface p-6">
      <p className="text-sm text-velora-accent">{date.format(new Date(n.startsAt))} · {n.areaName}</p>
      <h2 className="mt-2 font-display text-3xl">{n.title}</h2>
      <p className="mt-2 whitespace-pre-wrap break-words text-velora-ink2">{n.description}</p>
      <p className="mt-3 text-sm text-velora-muted">Hosted by {n.hostName} · up to {n.capacity} guests</p>
      {n.address && <p className="mt-5 rounded-xl border border-velora-accent p-4"><strong>Your meeting address:</strong> {n.address}<span className="mt-2 block text-sm text-velora-muted">Share it only with the host and guests. The host may still cancel; check before travelling.</span></p>}
      {n.isHost ? <div className="mt-5 border-t border-velora-line pt-4"><h3 className="font-semibold">Private requests</h3>{!n.requests?.length && <p className="mt-2 text-sm text-velora-muted">No requests yet.</p>}{n.requests?.map(r => <div key={r.id} className="mt-4 border-t border-velora-line pt-3"><Link href={`/profile/${r.applicantId}`} className="font-semibold underline">{r.applicantName}</Link><p className="my-2 whitespace-pre-wrap break-words">{r.pitch}</p><p className="text-xs text-velora-muted">{r.status}</p>{r.status === "REQUESTED" && <div className="mt-2 flex gap-4"><button disabled={busy} onClick={() => void action("PATCH", { requestId: r.id, status: "ACCEPTED" })} className="min-h-11 text-velora-accent underline">Accept</button><button disabled={busy} onClick={() => void action("PATCH", { requestId: r.id, status: "DECLINED" })} className="min-h-11 underline">Decline</button></div>}</div>)}<button disabled={busy} onClick={() => { if (confirm("Cancel this gathering for everyone?")) void action("PATCH", { nightId: n.id, status: "CANCELLED" }); }} className="mt-6 min-h-11 text-velora-crimson underline">Cancel gathering</button></div> : n.myRequest ? <div className="mt-5"><p role="status">Your request: {n.myRequest.status === "ACCEPTED" ? "You are on the Guest List" : n.myRequest.status.toLowerCase()}.</p>{["REQUESTED", "ACCEPTED"].includes(n.myRequest.status) && <button disabled={busy} onClick={() => void action("DELETE", undefined, n.myRequest!.id)} className="mt-2 min-h-11 text-velora-accent underline">Withdraw</button>}</div> : <form className="mt-5" onSubmit={e => { e.preventDefault(); void action("POST", { nightId: n.id, pitch: pitch[n.id] || "" }); }}><label className="block text-sm font-semibold">Your private note to the host<textarea value={pitch[n.id] || ""} onChange={e => setPitch(v => ({ ...v, [n.id]: e.target.value }))} maxLength={500} minLength={20} required placeholder="Who are you, and what draws you to this evening?" className="mt-2 min-h-28 w-full rounded-xl border border-velora-line bg-velora-sunken p-3"/></label><button disabled={busy || (pitch[n.id] || "").trim().length < 20} className="mt-3 min-h-12 rounded-full bg-velora-accent px-6 font-semibold text-velora-paper disabled:opacity-40">Request a place</button></form>}
      <p className="mt-5 text-xs text-velora-muted">Being accepted is an invitation to meet, never consent to touch or sex. You can withdraw; block or report a member at any time.</p>
    </article>)}</div>
  </main>;
}
