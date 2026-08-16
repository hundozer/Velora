"use client";

import React from "react";
import Link from "next/link";
import { BadgeCheck, CalendarHeart, MapPin, Search } from "lucide-react";

interface PublicAd {
  id: string;
  authorId: string;
  authorName: string;
  verified: boolean;
  title: string;
  category: string;
  location?: string;
  ageRange: string;
}
export function PublicDatingBrowse() {
  const [ads, setAds] = React.useState<PublicAd[]>([]);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const controller = new AbortController();
    fetch("/api/public/community?limit=1", { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Dating posts unavailable");
        setAds(Array.isArray(payload.datingAds) ? payload.datingAds : []);
      })
      .catch((cause) => { if (cause.name !== "AbortError") setError(cause.message || "Dating posts unavailable"); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const normalized = query.trim().toLowerCase();
  const visible = normalized
    ? ads.filter((ad) => `${ad.title} ${ad.category} ${ad.location || ""}`.toLowerCase().includes(normalized))
    : ads;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-300">Open invitations</p><h1 className="mt-2 font-serif text-3xl font-semibold text-white">Make the first move</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Discover people, couples, and possibilities nearby. See who is looking, what sparks their interest, and where the connection might lead.</p></div>
        <a href="/auth/login?screen_hint=signup" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-300 px-5 py-3 text-sm font-bold text-slate-950">Join free to interact</a>
      </div>
      <label className="relative mt-6 block max-w-xl"><span className="sr-only">Search public dating posts</span><Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles, categories, or location" className="min-h-11 w-full rounded-lg border border-white/10 bg-[#11151e] pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-amber-300/60" /></label>
      {loading ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-44 animate-pulse rounded-xl border border-white/10 bg-white/5" />)}</div>
      ) : error ? (
        <div className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-5 text-sm text-red-100">{error}</div>
      ) : visible.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{visible.map((ad) => <article key={ad.id} className="rounded-xl border border-white/10 bg-[#11151e] p-5"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-rose-300"><CalendarHeart className="h-4 w-4" />{ad.category}</div><h2 className="mt-3 text-lg font-semibold text-white">{ad.title}</h2><Link href={`/profile/${ad.authorId}`} className="mt-3 inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-amber-200">{ad.authorName}{ad.verified && <BadgeCheck className="h-4 w-4 text-emerald-400" />}</Link>{ad.location && <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5" />{ad.location}</p>}<p className="mt-2 text-xs text-slate-500">Preferred ages {ad.ageRange}</p><a href="/auth/login" className="mt-5 inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-white/10 text-sm font-semibold text-white hover:bg-white/5">Sign in to view and reply</a></article>)}</div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center"><CalendarHeart className="mx-auto h-7 w-7 text-slate-500" /><h2 className="mt-3 font-semibold text-white">No public dating posts match</h2><p className="mt-1 text-sm text-slate-400">Try another search or check again later.</p></div>
      )}
    </main>
  );
}
