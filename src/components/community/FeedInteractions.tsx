"use client";
import React from "react";
import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";

type Kind = "MEDIA" | "POST" | "DATING_AD" | "ALBUM";
type Comment = { id: string; authorId: string; body: string; createdAt: string; author: { displayName: string } ; canDelete: boolean };
export function FeedInteractions({ targetType, targetId, feedId }: { targetType: Kind; targetId: string; feedId: string }) {
  const [liked, setLiked] = React.useState(false);
  const [count, setCount] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [body, setBody] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const query = new URLSearchParams({ targetType, targetId });
  React.useEffect(() => {
    let active = true;
    fetch(`/api/reactions?${query}`, { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(p => { if (active && p) { setLiked(p.liked); setCount(p.count); } });
    return () => { active = false; };
  // IDs and type are the stable query inputs.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType, targetId]);
  React.useEffect(() => {
    if (new URLSearchParams(window.location.search).get("feedItem") !== `${targetType}:${targetId}`) return;
    setOpen(true);
    void fetch(`/api/comments?${query}`, { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(p => { if (p) setComments(p.comments || []); });
    document.getElementById(`feed-${feedId}`)?.scrollIntoView({ block: "center" });
  // Target identifiers are stable for a mounted card.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType, targetId, feedId]);
  async function loadComments() {
    const r = await fetch(`/api/comments?${query}`, { cache: "no-store" });
    const p = await r.json(); if (!r.ok) throw Error(p.error || "Comments unavailable"); setComments(p.comments || []);
  }
  async function toggleComments() { if (open) { setOpen(false); return; } setOpen(true); try { await loadComments(); } catch (e) { setError(e instanceof Error ? e.message : "Comments unavailable"); } }
  async function like() {
    if (busy) return; setBusy(true); setError("");
    try { const r = await fetch("/api/reactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetType, targetId }) }); const p = await r.json(); if (!r.ok) throw Error(p.error); setLiked(p.liked); setCount(p.count); }
    catch (e) { setError(e instanceof Error ? e.message : "Like unavailable"); } finally { setBusy(false); }
  }
  async function comment(e: React.FormEvent) {
    e.preventDefault(); if (!body.trim() || busy) return; setBusy(true); setError("");
    try { const r = await fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetType, targetId, text: body.trim() }) }); const p = await r.json(); if (!r.ok) throw Error(p.error); setBody(""); await loadComments(); }
    catch (e) { setError(e instanceof Error ? e.message : "Comment unavailable"); } finally { setBusy(false); }
  }
  async function remove(id: string) {
    const r = await fetch(`/api/comments?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (r.ok) await loadComments(); else setError("Could not remove comment");
  }
  return <div className="border-t border-velora-line px-5 pb-5 pt-3"><div className="flex gap-5 text-sm"><button type="button" onClick={() => void like()} disabled={busy} aria-pressed={liked} className="inline-flex min-h-11 items-center gap-2 text-velora-ink2 hover:text-velora-accent disabled:opacity-50"><Heart className={`h-5 w-5 ${liked ? "fill-velora-accent text-velora-accent" : ""}`} />Like{count > 0 ? ` · ${count}` : ""}</button><button type="button" onClick={() => void toggleComments()} aria-expanded={open} className="inline-flex min-h-11 items-center gap-2 text-velora-ink2 hover:text-velora-accent"><MessageCircle className="h-5 w-5" />Comments</button></div>{error && <p role="alert" className="mt-2 text-sm text-velora-danger">{error}</p>}{open && <section aria-label="Comments" className="mt-3 space-y-3"><div className="max-h-80 space-y-3 overflow-y-auto">{comments.length === 0 && <p className="text-sm text-velora-muted">No comments yet. Start the conversation.</p>}{comments.map(c => <div key={c.id} className="rounded-xl bg-velora-paper p-3 text-sm"><div className="flex justify-between gap-2"><Link href={`/profile/${c.authorId}`} className="font-semibold text-velora-ink underline">{c.author.displayName}</Link><time dateTime={c.createdAt} className="text-velora-muted">{new Date(c.createdAt).toLocaleDateString()}</time></div><p className="mt-1 whitespace-pre-wrap break-words text-velora-ink">{c.body}</p>{c.canDelete && <button onClick={() => void remove(c.id)} className="mt-1 min-h-10 text-xs text-velora-accent underline">Remove</button>}</div>)}</div><form onSubmit={e => void comment(e)} className="flex flex-col gap-2 sm:flex-row"><label className="sr-only" htmlFor={`comment-${targetId}`}>Write a comment</label><input id={`comment-${targetId}`} value={body} onChange={e => setBody(e.target.value)} maxLength={2000} placeholder="Write a comment…" className="min-h-11 flex-1 rounded-xl border border-velora-control bg-velora-paper px-3 text-velora-ink" /><button disabled={busy || !body.trim()} className="min-h-11 rounded-full bg-velora-accent px-5 font-semibold text-velora-paper disabled:opacity-50">Post</button></form></section>}</div>;
}
