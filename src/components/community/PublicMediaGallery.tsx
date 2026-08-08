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
  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><div className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Approved public media</p><h1 className="mt-2 font-serif text-3xl font-semibold text-white">{noun}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Only fully uploaded, processed, moderator-approved media from public active profiles appears here. Popularity is never fabricated.</p></div><button onClick={() => setDiscreet((value) => !value)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 px-4 text-sm font-semibold text-white"><EyeOff className="h-4 w-4" />Discreet previews: {discreet ? "On" : "Off"}</button></div>{loading ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="aspect-video animate-pulse rounded-xl border border-white/10 bg-white/5" />)}</div> : error ? <div className="mt-6 rounded-xl border border-amber-300/30 bg-amber-300/10 p-5 text-sm text-amber-100">{error}</div> : items.length ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <article key={item.id} className="overflow-hidden rounded-xl border border-white/10 bg-[#11151e]"><div className="relative aspect-video overflow-hidden bg-black">{item.type === "IMAGE" ? <img src={item.mediaUrl} alt={item.title} className={`h-full w-full object-cover transition ${discreet ? "scale-105 blur-xl" : ""}`} loading="lazy" /> : <video src={item.mediaUrl} controls={!discreet} preload="metadata" className={`h-full w-full object-contain transition ${discreet ? "blur-xl" : ""}`} />}{discreet && <button onClick={() => setDiscreet(false)} className="absolute inset-0 flex items-center justify-center bg-black/30 text-sm font-bold text-white">Reveal approved adult preview</button>}</div><div className="p-4"><p className="text-xs font-semibold uppercase tracking-wide text-amber-300">{item.category || item.type}</p><h2 className="mt-2 font-semibold text-white">{item.title}</h2>{item.description && <p className="mt-2 line-clamp-2 text-sm text-slate-400">{item.description}</p>}<Link href={`/profile/${item.owner.id}`} className="mt-3 inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-amber-200">{item.owner.displayName}{item.owner.verified && <BadgeCheck className="h-4 w-4 text-emerald-400" />}</Link></div></article>)}</div> : <div className="mt-6 rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center"><Icon className="mx-auto h-8 w-8 text-slate-500" /><h2 className="mt-3 font-semibold text-white">No approved public {noun.toLowerCase()} yet</h2><p className="mt-1 text-sm text-slate-400">Uploads do not appear here until processing and moderation are complete.</p></div>}<nav aria-label={`${noun} pagination`} className="mt-7 flex justify-center gap-3"><button disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="min-h-11 rounded-lg border border-white/10 px-4 text-sm font-semibold text-white disabled:opacity-40">Previous</button><span className="flex min-h-11 items-center px-3 text-sm text-slate-400">Page {page}</span><button disabled={!hasMore || loading} onClick={() => setPage((value) => value + 1)} className="min-h-11 rounded-lg border border-white/10 px-4 text-sm font-semibold text-white disabled:opacity-40">Next</button></nav></main>;
}
