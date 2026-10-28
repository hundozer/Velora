"use client";
import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { PERSONAL_CATEGORIES } from "@/lib/personalAds.mjs";

type Ad = { id: string; authorId: string; authorName: string; authorAge: number | null; category: string; categoryLabel: string; title: string; body: string; boundaries: string; areaName: string | null; createdAt: string; expiresAt: string; status: string; moderationStatus: string; isMine: boolean; canReply: boolean; replyReason: string | null };
export default function DatingPage() {
  const { user } = useAuth();
  const [category, setCategory] = React.useState("");
  const [mine, setMine] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const [ads, setAds] = React.useState<Ad[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [replyId, setReplyId] = React.useState<string | null>(null);
  const [reply, setReply] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  React.useEffect(() => { if (new URLSearchParams(window.location.search).get("mine") === "1") setMine(true); setReady(true); }, []);
  const load = React.useCallback(async () => {
    if (!ready) return;
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const q = new URLSearchParams(); if (mine) q.set("mine", "true"); if (category) q.set("category", category);
      const response = await fetch(`/api/personal-ads?${q}`, { cache: "no-store" });
      const payload = await response.json(); if (!response.ok) throw Error(payload.error || "Dating ads unavailable");
      setAds(payload.ads || []); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Dating ads unavailable"); }
    finally { setLoading(false); }
  }, [user, mine, category, ready]);
  React.useEffect(() => { void load(); }, [load]);
  async function send(ad: Ad) {
    if (reply.trim().length < 10 || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiverId: ad.authorId, personalAdId: ad.id, content: reply.trim() }) });
      const payload = await response.json(); if (!response.ok) throw Error(payload.error || "Reply failed");
      setSent(true); setReply(""); setReplyId(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Reply failed"); }
    finally { setBusy(false); }
  }
  async function close(ad: Ad) {
    if (!window.confirm("Close this dating ad?")) return;
    const response = await fetch(`/api/personal-ads/${ad.id}`, { method: "PATCH" });
    if (!response.ok) { const payload = await response.json().catch(() => ({})); setError(payload.error || "Could not close the ad"); return; }
    void load();
  }
  return <main className="mx-auto max-w-5xl px-5 pb-28 pt-10"><header className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-sm font-semibold uppercase tracking-widest text-velora-accent">Prague · adults only</p><h1 className="mt-3 font-display text-5xl text-velora-ink">Dating Ads</h1><p className="mt-3 max-w-xl text-lg text-velora-ink2">Sex, kink, a fuck buddy, or someone to talk dirty with. Say what you want and where your limits are.</p></div><Link href="/personal-ads/new" className="rounded-full bg-velora-accent px-6 py-3 font-semibold text-velora-paper">Post an ad</Link></header>
    <nav className="mt-8 flex flex-wrap gap-3 text-sm" aria-label="Find a connection"><Link href="/tonight" className="rounded-full border border-velora-line px-4 py-2">Sex tonight? See Tonight →</Link><button onClick={() => setMine(false)} aria-pressed={!mine} className="rounded-full border border-velora-line px-4 py-2">All ads</button><button onClick={() => setMine(true)} aria-pressed={mine} className="rounded-full border border-velora-line px-4 py-2">My ads</button></nav>
    <label className="mt-6 block max-w-sm text-sm font-semibold">What are you into?<select value={category} onChange={event => setCategory(event.target.value)} className="mt-2 w-full rounded-lg border border-velora-control bg-velora-surface p-3"><option value="">Everything</option>{PERSONAL_CATEGORIES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
    {!user ? <p className="mt-8">Dating ads are for signed-in adults. <Link href="/login" className="underline">Sign in</Link>.</p> : <>{error && <p role="alert" className="mt-5 text-velora-danger">{error}</p>}{sent && <p role="status" className="mt-5">Reply sent in Messages.</p>}{loading ? <p role="status" className="mt-10">Loading ads…</p> : !ads.length ? <p className="mt-10 rounded-xl border border-velora-line p-6">No {mine ? "ads from you" : "current ads match"}. <Link className="underline" href="/personal-ads/new">Post yours</Link> or widen your search.</p> : <div className="mt-8 space-y-5">{ads.map(ad => <article key={ad.id} className="rounded-2xl border border-velora-line bg-velora-surface p-5 sm:p-7"><div className="flex flex-wrap justify-between gap-3 text-sm"><span className="font-semibold text-velora-accent">{ad.categoryLabel}</span><span className="text-velora-muted">{ad.areaName || "Area private"} · {new Date(ad.createdAt).toLocaleDateString()}</span></div><h2 className="mt-3 font-display text-3xl">{ad.title}</h2><Link className="mt-2 inline-block text-sm font-semibold underline" href={`/profile/${ad.authorId}`}>{ad.authorName}{ad.authorAge ? ` · ${ad.authorAge}` : ""} · View profile</Link><p className="mt-5 whitespace-pre-wrap text-base leading-7">{ad.body}</p><p className="mt-4 rounded-lg border-l-2 border-velora-accent bg-velora-sunken p-3 text-sm"><strong>Off-limits:</strong> {ad.boundaries}</p><div className="mt-5 flex flex-wrap items-center gap-3">{ad.isMine ? <><span className="text-sm">{ad.moderationStatus === "PENDING_REVIEW" ? "Awaiting review" : ad.status === "CLOSED" ? "Closed" : ad.moderationStatus === "REJECTED" ? "Not published" : "Live until " + new Date(ad.expiresAt).toLocaleDateString()}</span>{ad.status === "ACTIVE" && <button onClick={() => close(ad)} className="rounded-full border border-velora-control px-4 py-2">Close ad</button>}</> : ad.canReply ? <button onClick={() => { setReplyId(ad.id === replyId ? null : ad.id); setSent(false); }} className="rounded-full bg-velora-accent px-5 py-2 font-semibold text-velora-paper">Reply privately</button> : <span className="text-sm text-velora-ink2">{ad.replyReason === "VERIFIED" ? "Verified members can reply" : "You don't match this ad's reply rules"}</span>}</div>{replyId === ad.id && <div className="mt-5"><label className="block text-sm font-semibold">Your first message<textarea value={reply} onChange={event => setReply(event.target.value)} maxLength={4000} rows={4} placeholder="Be direct. Say why you're interested and respect what's off-limits." className="mt-2 w-full rounded-lg border border-velora-control bg-velora-paper p-3" /></label><p className="mt-2 text-xs text-velora-muted">A reply starts a private chat. No one owes a response or a meeting.</p><button disabled={busy || reply.trim().length < 10} onClick={() => send(ad)} className="mt-3 rounded-full bg-velora-accent px-5 py-2 font-semibold text-velora-paper disabled:opacity-50">{busy ? "Sending…" : "Send reply"}</button></div>}</article>)}</div>}</>}
  </main>;
}
