"use client";

// Signed-out browse of members who chose a public profile. Signed-in members get MemberPeople.

import React from "react";
import Link from "next/link";
import { BadgeCheck, ChevronDown, ChevronLeft, ChevronRight, Clock3, MapPin, MapPinned, RotateCcw, Search, SlidersHorizontal, UserRound, Users } from "lucide-react";

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

const LOCATIONS: Record<string, string[]> = {
  "Czech Republic": ["Prague", "Brno", "Ostrava", "Plzeň", "Liberec", "Olomouc", "České Budějovice", "Hradec Králové", "Pardubice", "Zlín"],
  Slovakia: ["Bratislava", "Košice", "Prešov", "Žilina", "Nitra", "Banská Bystrica", "Trnava", "Trenčín", "Poprad"],
  Germany: ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", "Düsseldorf", "Leipzig", "Dresden", "Nuremberg"],
  Austria: ["Vienna", "Graz", "Linz", "Salzburg", "Innsbruck", "Klagenfurt", "Villach", "Wels"],
  Hungary: ["Budapest", "Debrecen", "Szeged", "Miskolc", "Pécs", "Győr", "Nyíregyháza", "Kecskemét", "Székesfehérvár"],
  Romania: ["Bucharest", "Cluj-Napoca", "Timișoara", "Iași", "Constanța", "Brașov", "Craiova", "Sibiu", "Oradea"],
};

export function PublicPeopleBrowse() {
  const [country, setCountry] = React.useState("");
  const [city, setCity] = React.useState("");
  const [profileType, setProfileType] = React.useState("");
  const [minAge, setMinAge] = React.useState("18");
  const [maxAge, setMaxAge] = React.useState("100");
  const [verifiedOnly, setVerifiedOnly] = React.useState(false);
  const [recentlyActive, setRecentlyActive] = React.useState(false);
  const [submittedFilters, setSubmittedFilters] = React.useState("minAge=18&maxAge=100");
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState<ResponseData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      const params = new URLSearchParams(submittedFilters);
      params.set("page", String(page));
      params.set("limit", "24");
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
  }, [submittedFilters, page]);

  function updateFilter(setter: (value: string) => void, value: string) {
    setter(value);
  }

  function resetFilters() {
    setCountry(""); setCity(""); setProfileType(""); setMinAge("18"); setMaxAge("100");
    setVerifiedOnly(false); setRecentlyActive(false); setPage(1); setSubmittedFilters("minAge=18&maxAge=100");
  }

  function changeCountry(value: string) {
    setCountry(value);
    setCity("");
  }

  function startSearch() {
    const params = new URLSearchParams();
    if (country) params.set("country", country);
    if (city) params.set("city", city);
    if (profileType === "COUPLE") params.set("profileType", "COUPLE");
    if (profileType === "MALE" || profileType === "FEMALE") params.set("gender", profileType);
    params.set("minAge", minAge || "18");
    params.set("maxAge", maxAge || "100");
    if (verifiedOnly) params.set("verified", "true");
    if (recentlyActive) params.set("recentlyActive", "true");
    setPage(1);
    setSubmittedFilters(params.toString());
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-velora-accent">Meet the community</p><h1 className="mt-2 font-display font-semibold text-ink text-5xl leading-[1.02] sm:text-6xl">Find people</h1><p className="mt-3 text-sm leading-6 text-velora-textSecondary">Discover members by age, location, profile type, verification, and recent activity.</p></div>

      <section aria-label="People filters" className="mt-7 overflow-hidden rounded-2xl border border-ink/10 bg-velora-surface shadow-2xl shadow-black/20">
        <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink"><SlidersHorizontal className="h-4 w-4 text-velora-accent" />Who to show</div>
          <button type="button" onClick={resetFilters} className="inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-xs font-semibold text-velora-textSecondary transition hover:bg-ink/5 hover:text-ink"><RotateCcw className="h-3.5 w-3.5" />Reset</button>
        </div>

        <div className="p-4 sm:p-6">
          <fieldset>
            <legend className="text-[11px] font-bold uppercase tracking-[0.16em] text-velora-textMuted">I want to meet</legend>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:max-w-xl sm:gap-3">
              {[
                { value: "MALE", label: "Man", icon: UserRound },
                { value: "FEMALE", label: "Woman", icon: UserRound },
                { value: "COUPLE", label: "Couples", icon: Users },
              ].map((option) => {
                const Icon = option.icon;
                const selected = profileType === option.value;
                return <button key={option.label} type="button" aria-pressed={selected} onClick={() => updateFilter(setProfileType, option.value)} className={`group flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition sm:min-h-16 sm:flex-row ${selected ? "border-velora-accent bg-velora-accent text-velora-paper shadow-lg shadow-velora-accent/20" : "border-ink/10 bg-ink/5 text-ink hover:border-velora-accent/40 hover:bg-ink/[0.04] hover:text-ink"}`}><Icon className="h-5 w-5" />{option.label}</button>;
              })}
            </div>
          </fieldset>

          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-[1fr_1.15fr_0.9fr]">
            <label className="group"><span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-velora-textMuted">Country</span><span className="relative block"><MapPinned className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-velora-textMuted group-focus-within:text-velora-accent" /><select value={country} onChange={(event) => changeCountry(event.target.value)} className="min-h-12 w-full appearance-none rounded-xl border border-ink/10 bg-velora-surface py-3 pl-10 pr-10 text-sm text-ink outline-none transition hover:border-ink/20 focus:border-velora-accent/60 focus:ring-2 focus:ring-velora-accent/10"><option value="">Anywhere</option>{Object.keys(LOCATIONS).map((name) => <option key={name} value={name}>{name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-velora-textMuted" /></span></label>
            <label className={`group ${country ? "" : "opacity-60"}`}><span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-velora-textMuted">City or region</span><span className="relative block"><MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-velora-textMuted group-focus-within:text-velora-accent" /><select disabled={!country} value={city} onChange={(event) => updateFilter(setCity, event.target.value)} className="min-h-12 w-full appearance-none rounded-xl border border-ink/10 bg-velora-surface py-3 pl-10 pr-10 text-sm text-ink outline-none transition enabled:hover:border-ink/20 focus:border-velora-accent/60 focus:ring-2 focus:ring-velora-accent/10 disabled:cursor-not-allowed"><option value="">{country ? `All of ${country}` : "Select a country first"}</option>{country && LOCATIONS[country].map((name) => <option key={name} value={name}>{name}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-velora-textMuted" /></span></label>
            <fieldset><legend className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-velora-textMuted">Age range</legend><div className="flex min-h-12 items-center rounded-xl border border-ink/10 bg-velora-surface px-3 transition focus-within:border-velora-accent/60 focus-within:ring-2 focus-within:ring-velora-accent/10"><input aria-label="Minimum age" type="number" min="18" max="100" value={minAge} onChange={(event) => updateFilter(setMinAge, event.target.value)} className="w-full bg-transparent text-center text-sm font-semibold text-ink outline-none" /><span className="px-2 text-velora-textMuted">—</span><input aria-label="Maximum age" type="number" min="18" max="100" value={maxAge} onChange={(event) => updateFilter(setMaxAge, event.target.value)} className="w-full bg-transparent text-center text-sm font-semibold text-ink outline-none" /></div></fieldset>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-4">
            <span className="mr-1 text-[11px] font-bold uppercase tracking-[0.14em] text-velora-textMuted">Show only</span>
            <button type="button" aria-pressed={verifiedOnly} onClick={() => setVerifiedOnly((value) => !value)} className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-xs font-semibold transition ${verifiedOnly ? "border-emerald-300/60 bg-emerald-300/15 text-velora-success" : "border-ink/10 bg-ink/5 text-ink hover:border-ink/25 hover:text-ink"}`}><BadgeCheck className="h-4 w-4" />Verified</button>
            <button type="button" aria-pressed={recentlyActive} onClick={() => setRecentlyActive((value) => !value)} className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-xs font-semibold transition ${recentlyActive ? "border-velora-accent/60 bg-velora-accent/15 text-velora-accent" : "border-ink/10 bg-ink/5 text-ink hover:border-ink/25 hover:text-ink"}`}><Clock3 className="h-4 w-4" />Online recently</button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
            <button type="button" onClick={startSearch} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-velora-accent px-6 text-sm font-extrabold text-velora-paper shadow-lg shadow-velora-accent/20 transition hover:bg-velora-accent active:scale-[0.99]"><Search className="h-4 w-4" />Start search</button>
            <Link href="/auth/login?returnTo=%2Fpeople" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-ink/15 bg-ink/[0.03] px-6 text-sm font-bold text-ink transition hover:border-velora-accent/50 hover:bg-velora-accent/10 hover:text-velora-accent"><SlidersHorizontal className="h-4 w-4" />Sign in for filters</Link>
          </div>
        </div>
      </section>

      <div className="mt-5 flex items-center justify-between text-xs text-velora-textMuted"><span>{data ? `${data.pagination.total} public ${data.pagination.total === 1 ? "profile" : "profiles"}` : "Loading directory"}</span><span>Page {page}</span></div>

      {data?.demoContentPresent && <div role="status" className="mt-4 rounded-xl border border-sky-300/30 bg-sky-300/10 px-4 py-3 text-sm text-velora-accent"><strong>Staging demo content:</strong> every profile marked Demo is fictional and exists only to test this directory.</div>}

      {loading ? <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-52 animate-pulse rounded-xl border border-ink/10 bg-ink/5" />)}</div> : error ? <div className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 p-5 text-sm text-red-100">{error}</div> : data?.profiles.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{data.profiles.map((profile) => {
          const initials = profile.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
          return <Link key={profile.id} href={`/profile/${profile.id}`} className="rounded-xl border border-ink/10 bg-velora-surface p-5 hover:border-velora-accent/40"><div className="flex items-start gap-3"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-velora-accent/10 font-display text-lg font-bold text-velora-accent">{initials || "I"}</div><div className="min-w-0"><div className="flex items-center gap-1.5"><h2 className="truncate font-semibold text-ink">{profile.displayName}</h2>{profile.isDemo && <span className="rounded bg-sky-300/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-velora-accent">Demo</span>}{profile.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-velora-success" />}</div><p className="mt-1 text-xs uppercase tracking-wide text-velora-textMuted">{profile.profileType === "COUPLE" ? "Couple" : "Individual"}{profile.age ? ` · ${profile.age}` : ""}</p></div></div>{profile.location && <p className="mt-4 flex items-center gap-1.5 text-xs text-velora-textSecondary"><MapPin className="h-3.5 w-3.5" />{profile.location}</p>}<p className="mt-3 line-clamp-3 text-sm leading-5 text-ink">{profile.headline || profile.bio || "Public member profile"}</p>{profile.recentlyActive && <p className="mt-4 text-xs font-semibold text-velora-success">Recently active</p>}</Link>;
        })}</div>
      ) : <div className="mt-4 rounded-xl border border-dashed border-ink/15 bg-ink/[0.02] p-10 text-center"><Users className="mx-auto h-7 w-7 text-velora-textMuted" /><h2 className="mt-3 font-semibold text-ink">No public profiles match</h2><p className="mt-1 text-sm text-velora-textSecondary">Try fewer filters, or check again as the community grows.</p></div>}

      <nav aria-label="People pagination" className="mt-7 flex justify-center gap-3"><button disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-ink/10 px-4 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-4 w-4" />Previous</button><button disabled={!data?.pagination.hasMore || loading} onClick={() => setPage((value) => value + 1)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-ink/10 px-4 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40">Next<ChevronRight className="h-4 w-4" /></button></nav>
    </main>
  );
}
