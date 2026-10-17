"use client";

import React from "react";
import Link from "next/link";
import { BOUNDARY_KINDS, type BoundaryPreference } from "@/lib/boundaries.mjs";

/** "How to approach" on a profile: lists only Ask-me-first and Not-interested preferences. */
export function ProfileBoundaries({ profileId, isOwner }: { profileId: string; isOwner: boolean }) {
  const [values, setValues] = React.useState<Record<string, BoundaryPreference> | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch(`/api/profiles/${encodeURIComponent(profileId)}/boundaries`, { credentials: "same-origin", cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => { if (!cancelled && payload) setValues(payload.boundaries || {}); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [profileId]);

  if (!values) return null;
  const label = (kind: (typeof BOUNDARY_KINDS)[number]) => kind.group === "first-message" ? `First messages from ${kind.label.toLowerCase()}` : kind.label;
  const askFirst = BOUNDARY_KINDS.filter((kind) => values[kind.id] === "ASK_FIRST");
  const notInterested = BOUNDARY_KINDS.filter((kind) => values[kind.id] === "NOT_INTERESTED");
  if (askFirst.length === 0 && notInterested.length === 0 && !isOwner) return null;

  return (
    <section className="space-y-4 rounded-3xl border border-white/10 bg-[#111722] p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-white">How to approach</h2>
        {isOwner && <Link href="/me/boundaries" className="text-sm text-amber-300">Edit</Link>}
      </div>
      {askFirst.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wide text-amber-300/80">Ask first</p>
          <ul className="mt-1 space-y-1 text-sm text-white/70">{askFirst.map((kind) => <li key={kind.id}>{label(kind)}</li>)}</ul>
        </div>
      )}
      {notInterested.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wide text-red-300/70">Not interested</p>
          <ul className="mt-1 space-y-1 text-sm text-white/70">{notInterested.map((kind) => <li key={kind.id}>{label(kind)}</li>)}</ul>
        </div>
      )}
      {isOwner && askFirst.length === 0 && notInterested.length === 0 && <p className="text-sm text-white/55">You&apos;re open to everything. Set boundaries so people know how to approach you.</p>}
    </section>
  );
}
