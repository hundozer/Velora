"use client";

import React from "react";
import Link from "next/link";
import { BadgeCheck, ChevronLeft, ChevronRight, MapPin, Search, Users } from "lucide-react";

interface PublicProfile {
  id: string;
  displayName: string;
  age?: number;
  location?: string;
  headline?: string;
  bio?: string;
  profileType: "COUPLE" | "INDIVIDUAL";
  verified: boolean;
  recentlyActive: boolean;
  isDemo: boolean;
}
interface ResponseData {
  profiles: PublicProfile[];
  pagination: { page: number; total: number; hasMore: boolean };
  demoContentPresent: boolean;
}

export default function PeoplePage() {
  const [query, setQuery] = React.useState("");
  const [country, setCountry] = React.useState("");
  const [profileType, setProfileType] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState<ResponseData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ page: String(page), limit: "24" });
      if (query.trim()) params.set("q", query.trim());
      if (country.trim()) params.set("country", country.trim());
      if (profileType) params.set("profileType", profileType);
      fetch(`/api/public/community?${params}`, { signal: controller.signal })
        .then(async (response) => {
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(payload.error || "People unavailable");
          setData(payload);
        })
        .catch((cause) => { if (cause.name !== "AbortError") setError(cause.message || "People unavailable"); })
        .finally(() => setLoading(false));
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, country, profileType, page]);

  function updateFilter(setter: (value: string) => void, value: string) {
    setPage(1);
    setter(value);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Public directory</p><h1 className="mt-2 font-serif text-3xl font-semibold text-white">People</h1><p className="mt-3 text-sm leading-6 text-slate-400">Only active members who explicitly selected public profile visibility appear here. Results use deterministic newest-first ordering.</p></div>

      <section aria-label="People filters" className="mt-7 grid gap-3 rounded-xl border border-white/10 bg-[#11151e] p-4 sm:grid-cols-3">
        <label className="relative"><span className="sr-only">Search people</span><Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" /><input value={query} onChange={(event) => updateFilter(setQuery, event.target.value)} placeholder="Name or headline" className="min-h-11 w-full rounded-lg border border-white/10 bg-black/20 pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-amber-300/60" /></label>
        <label><span className="sr-only">Country</span><input value={country} onChange={(event) => updateFilter(setCountry, event.target.value)} placeholder="Country (exact)" className="min-h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-amber-300/60" /></label>
        <label><span className="sr-only">Profile type</span><select value={profileType} onChange={(event) => updateFilter(setProfileType, event.target.value)} className="min-h-11 w-full rounded-lg border border-white/10 bg-[#0b0e14] px-3 text-sm text-white outline-none focus:border-amber-300/60"><option value="">All profile types</option><option value="INDIVIDUAL">Individual</option><option value="COUPLE">Couple</option></select></label>
      </section>

      <div className="mt-5 flex items-center justify-between text-xs text-slate-500"><span>{data ? `${data.pagination.total} public ${data.pagination.total === 1 ? "profile" : "profiles"}` : "Loading directory"}</span><span>Page {page}</span></div>

      {data?.demoContentPresent && <div role="status" className="mt-4 rounded-xl border border-sky-300/30 bg-sky-300/10 px-4 py-3 text-sm text-sky-100"><strong>Staging demo content:</strong> every profile marked Demo is fictional and exists only to test this directory.</div>}

      {loading ? <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-52 animate-pulse rounded-xl border border-white/10 bg-white/5" />)}</div> : error ? <div className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 p-5 text-sm text-red-100">{error}</div> : data?.profiles.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{data.profiles.map((profile) => {
          const initials = profile.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
          return <Link key={profile.id} href={`/profile/${profile.id}`} className="rounded-xl border border-white/10 bg-[#11151e] p-5 hover:border-amber-300/40"><div className="flex items-start gap-3"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber-300/10 font-serif text-lg font-bold text-amber-200">{initials || "I"}</div><div className="min-w-0"><div className="flex items-center gap-1.5"><h2 className="truncate font-semibold text-white">{profile.displayName}</h2>{profile.isDemo && <span className="rounded bg-sky-300/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-sky-200">Demo</span>}{profile.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-400" />}</div><p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{profile.profileType === "COUPLE" ? "Couple" : "Individual"}{profile.age ? ` · ${profile.age}` : ""}</p></div></div>{profile.location && <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400"><MapPin className="h-3.5 w-3.5" />{profile.location}</p>}<p className="mt-3 line-clamp-3 text-sm leading-5 text-slate-300">{profile.headline || profile.bio || "Public member profile"}</p>{profile.recentlyActive && <p className="mt-4 text-xs font-semibold text-emerald-400">Recently active</p>}</Link>;
        })}</div>
      ) : <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center"><Users className="mx-auto h-7 w-7 text-slate-500" /><h2 className="mt-3 font-semibold text-white">No public profiles match</h2><p className="mt-1 text-sm text-slate-400">Try fewer filters, or check again as the community grows.</p></div>}

      <nav aria-label="People pagination" className="mt-7 flex justify-center gap-3"><button disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-4 w-4" />Previous</button><button disabled={!data?.pagination.hasMore || loading} onClick={() => setPage((value) => value + 1)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/10 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Next<ChevronRight className="h-4 w-4" /></button></nav>
    </main>
  );
}
