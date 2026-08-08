"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { BadgeCheck, CalendarHeart, MapPin, Search, ShieldCheck, Users } from "lucide-react";

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
}
interface PublicDatingAd {
  id: string;
  authorId: string;
  authorName: string;
  verified: boolean;
  title: string;
  category: string;
  location?: string;
  ageRange: string;
}

interface CommunityResponse {
  profiles: PublicProfile[];
  datingAds: PublicDatingAd[];
  pagination: { total: number };
}

function Initials({ name }: { name: string }) {
  const initials = name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div aria-hidden="true" className="h-14 w-14 shrink-0 rounded-full border border-amber-300/30 bg-amber-300/10 flex items-center justify-center font-serif text-lg font-bold text-amber-200">
      {initials || "I"}
    </div>
  );
}

export function PublicCommunityHome() {
  const { user } = useAuth();
  const [data, setData] = React.useState<CommunityResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const controller = new AbortController();
    fetch("/api/public/community?limit=8", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Community unavailable");
        return response.json();
      })
      .then(setData)
      .catch((cause) => {
        if (cause.name !== "AbortError") setError("The public community could not be loaded. Please try again shortly.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  return (
    <div className="min-h-screen bg-[#090b10]">
      <section className="border-b border-white/10 bg-[#0e1118]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">The Intimo community</p>
              <h1 className="mt-2 font-serif text-3xl font-semibold text-white sm:text-4xl">Meet people before you decide to join.</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Browse profiles and current dating posts that members have deliberately made public. Private activity, messages, intimate preferences, and exact locations stay private.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/people" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-amber-300 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-amber-200"><Search className="h-4 w-4" /> Browse people</Link>
              {user ? (
                <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-lg border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5">My dashboard</Link>
              ) : (
                <a href="/auth/login?screen_hint=signup" className="inline-flex min-h-11 items-center rounded-lg border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5">Join free</a>
              )}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        <section aria-labelledby="new-members">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 id="new-members" className="text-xl font-bold text-white">New public members</h2>
              <p className="mt-1 text-sm text-slate-400">Newest first. No paid placement or hidden ranking.</p>
            </div>
            <Link href="/people" className="text-sm font-semibold text-amber-300 hover:text-amber-200">View all</Link>
          </div>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Loading public members">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-44 animate-pulse rounded-xl border border-white/10 bg-white/5" />)}</div>
          ) : error ? (
            <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-5 text-sm text-red-100">{error}</div>
          ) : data?.profiles.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {data.profiles.map((profile) => (
                <Link key={profile.id} href={`/profile/${profile.id}`} className="rounded-xl border border-white/10 bg-[#121620] p-5 transition hover:border-amber-300/40 hover:bg-[#151a25]">
                  <div className="flex items-start gap-3"><Initials name={profile.displayName} /><div className="min-w-0"><div className="flex items-center gap-1.5"><h3 className="truncate font-semibold text-white">{profile.displayName}</h3>{profile.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-400" aria-label="Verified" />}</div><p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{profile.profileType === "COUPLE" ? "Couple" : "Individual"}{profile.age ? ` · ${profile.age}` : ""}</p></div></div>
                  {profile.location && <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400"><MapPin className="h-3.5 w-3.5" />{profile.location}</p>}
                  <p className="mt-3 line-clamp-2 text-sm leading-5 text-slate-300">{profile.headline || profile.bio || "This member has made their basic profile public."}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center"><Users className="mx-auto h-7 w-7 text-slate-500" /><h3 className="mt-3 font-semibold text-white">No public profiles yet</h3><p className="mt-1 text-sm text-slate-400">Members control whether their profiles appear here.</p></div>
          )}
        </section>

        <section aria-labelledby="dating-posts">
          <div className="mb-4 flex items-end justify-between gap-4"><div><h2 id="dating-posts" className="text-xl font-bold text-white">Latest dating posts</h2><p className="mt-1 text-sm text-slate-400">Active public summaries from visible members.</p></div><Link href="/dating" className="text-sm font-semibold text-amber-300 hover:text-amber-200">Browse dating</Link></div>
          {data?.datingAds.length ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{data.datingAds.slice(0, 6).map((ad) => <Link key={ad.id} href={`/dating?ad=${encodeURIComponent(ad.id)}`} className="rounded-xl border border-white/10 bg-[#121620] p-5 hover:border-rose-300/30"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-rose-300"><CalendarHeart className="h-4 w-4" />{ad.category}</div><h3 className="mt-3 text-base font-semibold text-white">{ad.title}</h3><p className="mt-2 text-sm text-slate-400">By {ad.authorName}{ad.verified ? " · Verified" : ""}</p>{ad.location && <p className="mt-3 text-xs text-slate-500">{ad.location} · Preferred ages {ad.ageRange}</p>}</Link>)}</div>
          ) : !loading && !error ? (
            <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center"><CalendarHeart className="mx-auto h-7 w-7 text-slate-500" /><h3 className="mt-3 font-semibold text-white">No active public dating posts</h3><p className="mt-1 text-sm text-slate-400">New posts will appear only when their author is publicly visible.</p></div>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-[#10141d] p-5"><ShieldCheck className="h-5 w-5 text-emerald-400" /><h2 className="mt-3 font-semibold text-white">Privacy-first public browsing</h2><p className="mt-2 text-sm leading-5 text-slate-400">Only explicitly public, active profiles appear. Sensitive preference fields and private media are excluded.</p></div>
          <div className="rounded-xl border border-white/10 bg-[#10141d] p-5"><Users className="h-5 w-5 text-amber-300" /><h2 className="mt-3 font-semibold text-white">Real empty states</h2><p className="mt-2 text-sm leading-5 text-slate-400">Intimo does not invent members, activity, likes, albums, or popularity to make the community look busy.</p></div>
          <div className="rounded-xl border border-white/10 bg-[#10141d] p-5"><BadgeCheck className="h-5 w-5 text-sky-300" /><h2 className="mt-3 font-semibold text-white">Actions require an account</h2><p className="mt-2 text-sm leading-5 text-slate-400">Following, messaging, posting, saving, and reporting use authenticated, server-authorized workflows.</p></div>
        </section>
      </main>
    </div>
  );
}
