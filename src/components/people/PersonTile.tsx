"use client";

import React from "react";
import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";

export type Person = {
  id: string; displayName: string; age?: number; isCoupleProfile?: boolean; avatarUrl?: string; verified?: boolean;
  presence?: "ONLINE" | "TODAY" | "WEEK" | null; presenceLabel?: string | null; areaName?: string | null; distance?: string | null; headline?: string;
};

/** Compact member tile for the People grid and rails. Shows only coarse location and activity. */
export function PersonTile({ person, compact = false }: { person: Person; compact?: boolean }) {
  return (
    <Link href={`/profile/${person.id}`} className={`group block overflow-hidden rounded-2xl border border-ink/10 bg-velora-card/70 transition hover:border-velora-gold/40 ${compact ? "w-36 shrink-0" : ""}`}>
      <div className="relative aspect-[4/5] bg-velora-bg">
        {person.avatarUrl
          ? // eslint-disable-next-line @next/next/no-img-element
            <img src={person.avatarUrl} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.02]" loading="lazy" />
          : <div className="flex h-full items-center justify-center font-serif text-4xl text-velora-gold/60">{person.displayName.slice(0, 1).toUpperCase()}</div>}
        {person.presence === "ONLINE" && <span className="absolute left-2 top-2 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-velora-bg" aria-label="Online now" />}
      </div>
      <div className="space-y-0.5 p-3">
        <p className="flex items-center gap-1 truncate text-sm font-semibold text-velora-textPrimary">
          <span className="truncate">{person.displayName}{person.age ? `, ${person.age}` : ""}</span>
          {person.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-700" aria-label="Verified" />}
        </p>
        <p className="truncate text-[11px] text-velora-textMuted">{person.isCoupleProfile ? "Couple" : person.presenceLabel || " "}</p>
        {(person.areaName || person.distance) && (
          <p className="flex items-center gap-1 truncate text-[11px] text-velora-textMuted"><MapPin className="h-3 w-3 shrink-0" aria-hidden />{[person.areaName, person.distance].filter(Boolean).join(" · ")}</p>
        )}
      </div>
    </Link>
  );
}
