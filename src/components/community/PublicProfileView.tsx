"use client";

import React from "react";
import Link from "next/link";
import { BadgeCheck, LockKeyhole, MapPin, UserRound } from "lucide-react";

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
export function PublicProfileView({ profileId }: { profileId: string }) {
  const [profile, setProfile] = React.useState<PublicProfile | null>(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/public/profiles/${encodeURIComponent(profileId)}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Profile unavailable");
        setProfile(payload.profile);
      })
      .catch((cause) => { if (cause.name !== "AbortError") setError(cause.message || "Profile unavailable"); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [profileId]);

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-16"><div className="h-72 animate-pulse rounded-2xl border border-white/10 bg-white/5" /></div>;
  if (error || !profile) return <div className="mx-auto max-w-3xl px-4 py-20 text-center"><LockKeyhole className="mx-auto h-8 w-8 text-slate-500" /><h1 className="mt-4 text-2xl font-bold text-white">Profile unavailable</h1><p className="mt-2 text-sm text-slate-400">This profile is private, hidden, restricted, or no longer available.</p><Link href="/people" className="mt-6 inline-flex rounded-lg bg-amber-300 px-5 py-3 text-sm font-bold text-slate-950">Browse public people</Link></div>;

  const initials = profile.displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <article className="overflow-hidden rounded-2xl border border-white/10 bg-[#11151e]">
        <div className="h-28 bg-gradient-to-r from-amber-300/10 via-white/[0.03] to-rose-300/10" />
        <div className="px-5 pb-8 sm:px-8">
          <div className="-mt-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4"><div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#11151e] bg-amber-300 text-2xl font-serif font-bold text-slate-950">{initials || <UserRound />}</div><div className="pb-1"><div className="flex items-center gap-2"><h1 className="text-2xl font-bold text-white">{profile.displayName}</h1>{profile.verified && <BadgeCheck className="h-5 w-5 text-emerald-400" aria-label="Verified" />}</div><p className="mt-1 text-xs uppercase tracking-wider text-slate-500">{profile.profileType === "COUPLE" ? "Couple profile" : "Individual profile"}{profile.age ? ` · ${profile.age}` : ""}</p></div></div>
            <a href="/auth/login" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-300 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-amber-200">Sign in to interact</a>
          </div>
          {profile.location && <p className="mt-6 flex items-center gap-2 text-sm text-slate-400"><MapPin className="h-4 w-4" />{profile.location}</p>}
          {profile.headline && <h2 className="mt-6 text-lg font-semibold text-white">{profile.headline}</h2>}
          {profile.bio && <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-300">{profile.bio}</p>}
          <div className="mt-8 rounded-xl border border-white/10 bg-black/20 p-5"><h2 className="font-semibold text-white">Public profile summary</h2><p className="mt-2 text-sm leading-6 text-slate-400">Media, intimate preferences, social connections, and activity are not included in anonymous profile responses. Sign in for member-visible information, subject to this person’s privacy settings and blocks.</p></div>
        </div>
      </article>
    </main>
  );
}
