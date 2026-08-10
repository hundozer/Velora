"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { BadgeCheck, CalendarHeart, MapPin, Search } from "lucide-react";
import { MemberActivityFeed } from "@/components/community/MemberActivityFeed";

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
  demoContentPresent: boolean;
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
  const { user, isAuthLoading } = useAuth();
  const [data, setData] = React.useState<CommunityResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const controller = new AbortController();
    fetch("/api/public/community?limit=8", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Community unavailable");
        return response.json();
      })
      .then(setData)
      .catch((cause) => {
        if (cause.name !== "AbortError") {
          setData(null);
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  if (isAuthLoading) return <div className="min-h-screen animate-pulse bg-[#090b10]" />;
  if (user) return <MemberActivityFeed />;

  return (
    <div className="min-h-screen bg-[#090b10]">
      <section className="relative isolate min-h-[440px] overflow-hidden border-b border-white/10 bg-[#0e1118] sm:min-h-[520px]">
        <Image src="/marketing/intimo-community-hero.jpg" alt="Adults socializing in an elegant lounge" fill priority sizes="100vw" className="-z-20 object-cover object-center" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black via-black/75 to-black/15" />
        <div className="mx-auto flex min-h-[440px] max-w-7xl items-end px-4 py-10 sm:min-h-[520px] sm:px-6 sm:py-14 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">The Intimo community</p>
            <h1 className="mt-3 font-serif text-5xl font-semibold leading-[0.98] text-white sm:text-6xl lg:text-7xl">Find your people.</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-200 sm:text-lg">Profiles, dating, photos, and videos in one adults-only community.</p>
            <div className="mt-7 flex flex-wrap gap-3">
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

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-7 sm:px-6 lg:px-8">
        {data?.demoContentPresent && <div role="status" className="rounded-xl border border-sky-300/30 bg-sky-300/10 px-4 py-3 text-sm text-sky-100"><strong>Staging demo content:</strong> profiles labeled Demo are fictional test records, not real members or activity.</div>}
        <section aria-labelledby="explore-intimo">
          <h2 id="explore-intimo" className="sr-only">Explore Intimo</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["People", "/people", "20% center"], ["Dating", "/dating", "42% center"],
              ["Photos", "/photos", "68% center"], ["Videos", "/videos", "88% center"],
            ].map(([label, href, position]) => <Link key={label} href={href} className="group relative min-h-32 overflow-hidden rounded-xl border border-white/10 bg-[#11151e] sm:min-h-40"><Image src="/marketing/intimo-community-hero.jpg" alt="" aria-hidden="true" fill sizes="(max-width: 1024px) 50vw, 25vw" className="scale-125 object-cover opacity-65 transition duration-500 group-hover:scale-110 group-hover:opacity-80" style={{ objectPosition: position }} /><span className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" /><span className="absolute bottom-4 left-4 text-lg font-bold text-white sm:text-xl">{label}</span></Link>)}
          </div>
        </section>

        {(loading || data?.profiles.length) && <section aria-labelledby="new-members">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 id="new-members" className="text-xl font-bold text-white">New public members</h2>
            </div>
            <Link href="/people" className="text-sm font-semibold text-amber-300 hover:text-amber-200">View all</Link>
          </div>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Loading public members">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-44 animate-pulse rounded-xl border border-white/10 bg-white/5" />)}</div>
          ) : data?.profiles.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {data.profiles.map((profile) => (
                <Link key={profile.id} href={`/profile/${profile.id}`} className="rounded-xl border border-white/10 bg-[#121620] p-5 transition hover:border-amber-300/40 hover:bg-[#151a25]">
                  <div className="flex items-start gap-3"><Initials name={profile.displayName} /><div className="min-w-0"><div className="flex items-center gap-1.5"><h3 className="truncate font-semibold text-white">{profile.displayName}</h3>{profile.isDemo && <span className="rounded bg-sky-300/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-sky-200">Demo</span>}{profile.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-400" aria-label="Verified" />}</div><p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{profile.profileType === "COUPLE" ? "Couple" : "Individual"}{profile.age ? ` · ${profile.age}` : ""}</p></div></div>
                  {profile.location && <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400"><MapPin className="h-3.5 w-3.5" />{profile.location}</p>}
                  <p className="mt-3 line-clamp-2 text-sm leading-5 text-slate-300">{profile.headline || profile.bio || "This member has made their basic profile public."}</p>
                </Link>
              ))}
            </div>
          ) : null}
        </section>}

        {data?.datingAds.length ? <section aria-labelledby="dating-posts">
          <div className="mb-4 flex items-end justify-between gap-4"><h2 id="dating-posts" className="text-xl font-bold text-white">Latest dating posts</h2><Link href="/dating" className="text-sm font-semibold text-amber-300 hover:text-amber-200">View all</Link></div>
          {data?.datingAds.length ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{data.datingAds.slice(0, 6).map((ad) => <Link key={ad.id} href={`/dating?ad=${encodeURIComponent(ad.id)}`} className="rounded-xl border border-white/10 bg-[#121620] p-5 hover:border-rose-300/30"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-rose-300"><CalendarHeart className="h-4 w-4" />{ad.category}</div><h3 className="mt-3 text-base font-semibold text-white">{ad.title}</h3><p className="mt-2 text-sm text-slate-400">By {ad.authorName}{ad.verified ? " · Verified" : ""}</p>{ad.location && <p className="mt-3 text-xs text-slate-500">{ad.location} · Preferred ages {ad.ageRange}</p>}</Link>)}</div>
          ) : null}
        </section> : null}
      </main>
    </div>
  );
}
