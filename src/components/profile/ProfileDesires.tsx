"use client";

import React from "react";
import Link from "next/link";
import { desireById, type DesireState } from "@/lib/desires.mjs";

type Row = { desire_id: string; state: DesireState };

const GROUPS: { state: DesireState; label: string }[] = [
  { state: "LOVE", label: "Loves" },
  { state: "INTO", label: "Into" },
  { state: "CURIOUS", label: "Curious about" },
];

/** Desire Graph on a profile: shared desires first, hard limits visible but separate. */
export function ProfileDesires({ profileId, isOwner }: { profileId: string; isOwner: boolean }) {
  const [rows, setRows] = React.useState<Row[] | null>(null);
  const [shared, setShared] = React.useState<string[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    fetch(`/api/profiles/${encodeURIComponent(profileId)}/desires`, { credentials: "same-origin", cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (cancelled || !payload) return;
        setRows(payload.desires || []);
        setShared(payload.shared || []);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [profileId]);

  if (!rows) return null;
  const visible = rows.filter((row) => desireById(row.desire_id));
  if (visible.length === 0) {
    return isOwner ? (
      <section className="rounded-3xl border border-dashed border-white/15 p-6">
        <h2 className="text-xl font-bold text-white">Desires</h2>
        <p className="mt-2 text-sm text-white/55">Tell members what you&apos;re into, curious about, and where your limits are.</p>
        <Link href="/me/desires" className="mt-3 inline-block text-amber-300 underline">Add desires</Link>
      </section>
    ) : null;
  }

  const sharedSet = new Set(shared);
  const label = (id: string) => desireById(id)?.label ?? id;
  const chip = (id: string, tone: "shared" | "plain" | "limit") => (
    <span key={id} className={`rounded-full border px-3 py-1 text-sm ${tone === "shared" ? "border-amber-300/60 bg-amber-300/15 text-amber-100" : tone === "limit" ? "border-red-400/40 bg-red-500/10 text-red-200" : "border-white/15 bg-white/5 text-white/75"}`}>{label(id)}</span>
  );
  const limits = visible.filter((row) => row.state === "HARD_LIMIT");

  return (
    <section className="space-y-4 rounded-3xl border border-white/10 bg-[#111722] p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Desires</h2>
        {isOwner && <Link href="/me/desires" className="text-sm text-amber-300">Edit</Link>}
      </div>
      {shared.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wide text-amber-300/80">You both want</p>
          <div className="mt-2 flex flex-wrap gap-2">{shared.map((id) => chip(id, "shared"))}</div>
        </div>
      )}
      {GROUPS.map((group) => {
        const ids = visible.filter((row) => row.state === group.state && !sharedSet.has(row.desire_id)).map((row) => row.desire_id);
        return ids.length > 0 ? (
          <div key={group.state}>
            <p className="text-xs uppercase tracking-wide text-white/40">{group.label}</p>
            <div className="mt-2 flex flex-wrap gap-2">{ids.map((id) => chip(id, "plain"))}</div>
          </div>
        ) : null;
      })}
      {limits.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wide text-red-300/70">Hard limits</p>
          <div className="mt-2 flex flex-wrap gap-2">{limits.map((row) => chip(row.desire_id, "limit"))}</div>
        </div>
      )}
    </section>
  );
}
