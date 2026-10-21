"use client";
/* eslint-disable @next/next/no-img-element */

import React from "react";
import Link from "next/link";
import { BadgeCheck, EyeOff, Image as ImageIcon, Video } from "lucide-react";

type MediaItem = {
  id: string; type: "IMAGE" | "VIDEO"; mimeType: string; title: string; description?: string;
  category?: string; tags: string[]; mediaUrl: string; publishedAt: string;
  owner: { id: string; displayName: string; verified: boolean };
};

export function PublicMediaGallery({ type }: { type: "IMAGE" | "VIDEO" }) {
  const [items, setItems] = React.useState<MediaItem[]>([]);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [discreet, setDiscreet] = React.useState(true);

  React.useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError("");
    fetch(`/api/public/media?type=${type}&page=${page}&limit=18`, { signal: controller.signal })
      .then(async (response) => { const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload.error || "Media unavailable"); return payload; })
      .then((payload) => { setItems(payload.media || []); setHasMore(payload.pagination?.hasMore === true); })
      .catch((cause) => { if (cause.name !== "AbortError") setError(cause.message || "Media unavailable"); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [page, type]);

  const noun = type === "IMAGE" ? "Photos" : "Videos";
  const Icon = type === "IMAGE" ? ImageIcon : Video;
  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><div className="flex flex-col gap-5 border-b border-ink/10 pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-velora-accent">From the community</p><h1 className="mt-2 font-display font-semibold text-ink text-5xl leading-[1.02] sm:text-6xl">{noun}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-velora-textSecondary">Discover {noun.toLowerCase()} shared by Intimo members.</p></div><button onClick={() => setDiscreet((value) => !value)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-ink/15 px-4 text-sm font-semibold text-ink"><EyeOff className="h-4 w-4" />Discreet previews: {discreet ? "On" : "Off"}</button></div>{loading ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="aspect-video animate-pulse rounded-xl border border-ink/10 bg-ink/5" />)}</div> : error ? <div className="mt-6 rounded-xl border border-velora-accent/30 bg-velora-accent/10 p-5 text-sm text-velora-accent">{error}</div> : items.length ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <article key={item.id} className="overflow-hidden rounded-xl border border-ink/10 bg-velora-surface"><div className="relative aspect-video overflow-hidden bg-black">{item.type === "IMAGE" ? <img src={item.mediaUrl} alt={item.title} className={`h-full w-full object-cover transition ${discreet ? "scale-105 blur-xl" : ""}`} loading="lazy" /> : <video src={item.mediaUrl} controls={!discreet} preload="metadata" className={`h-full w-full object-contain transition ${discreet ? "blur-xl" : ""}`} />}{discreet && <button onClick={() => setDiscreet(false)} className="absolute inset-0 flex items-center justify-center bg-ink/5 text-sm font-bold text-ink">Show preview</button>}</div><div className="p-4"><p className="text-xs font-semibold uppercase tracking-wide text-velora-accent">{item.category || item.type}</p><h2 className="mt-2 font-semibold text-ink">{item.title}</h2>{item.description && <p className="mt-2 line-clamp-2 text-sm text-velora-textSecondary">{item.description}</p>}<Link href={`/profile/${item.owner.id}`} className="mt-3 inline-flex items-center gap-1.5 text-sm text-ink hover:text-velora-accent">{item.owner.displayName}{item.owner.verified && <BadgeCheck className="h-4 w-4 text-velora-success" />}</Link></div></article>)}</div> : <div className="mt-6 rounded-xl border border-dashed border-ink/15 bg-ink/[0.02] p-12 text-center"><Icon className="mx-auto h-8 w-8 text-velora-textMuted" /><h2 className="mt-3 font-semibold text-ink">No public {noun.toLowerCase()} yet</h2><p className="mt-1 text-sm text-velora-textSecondary">New uploads will appear here as members share them.</p></div>}<nav aria-label={`${noun} pagination`} className="mt-7 flex justify-center gap-3"><button disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="min-h-11 rounded-lg border border-ink/10 px-4 text-sm font-semibold text-ink disabled:opacity-40">Previous</button><span className="flex min-h-11 items-center px-3 text-sm text-velora-textSecondary">Page {page}</span><button disabled={!hasMore || loading} onClick={() => setPage((value) => value + 1)} className="min-h-11 rounded-lg border border-ink/10 px-4 text-sm font-semibold text-ink disabled:opacity-40">Next</button></nav></main>;
}
