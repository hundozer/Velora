"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { BehindTheDoorLanding } from "@/components/landing/BehindTheDoorLanding";
import { PersonTile, type Person } from "@/components/people/PersonTile";

type Entry = Person & { when: string };
type Tab = "MUTUAL" | "INTERESTED" | "VISITORS";

/** Activity (P1-08): mutual interest, who's interested in you, and who visited. */
export default function ActivityPage() {
  const { user } = useAuth();
  const [data, setData] = React.useState<{ visitors: Entry[]; interestedInYou: Entry[]; mutual: Entry[]; browseInvisibly: boolean } | null>(null);
  const [tab, setTab] = React.useState<Tab>("MUTUAL");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!user) return;
    fetch("/api/activity", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Activity could not be loaded.");
        setData(payload);
        // Open on the most rewarding non-empty tab.
        setTab(payload.mutual?.length ? "MUTUAL" : payload.interestedInYou?.length ? "INTERESTED" : "VISITORS");
      })
      .catch((cause) => setError(cause.message));
  }, [user]);

  if (!user) return <BehindTheDoorLanding />;

  const tabs: { id: Tab; label: string; items: Entry[] }[] = data ? [
    { id: "MUTUAL", label: "Both interested", items: data.mutual },
    { id: "INTERESTED", label: "Interested in you", items: data.interestedInYou },
    { id: "VISITORS", label: "Visitors", items: data.visitors },
  ] : [];
  const current = tabs.find((item) => item.id === tab);

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 pb-24 pt-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-velora-gold">Activity</p>
        <h1 className="font-serif text-3xl font-bold text-velora-textPrimary">Who&apos;s noticed you</h1>
      </header>
      {error && <p role="alert" className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">{error}</p>}
      {!data ? (
        <p className="text-sm text-velora-textMuted">Loading…</p>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto" role="tablist" aria-label="Activity">
            {tabs.map((item) => (
              <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)} className={`min-h-9 shrink-0 rounded-full border px-4 text-xs font-semibold transition ${tab === item.id ? "border-velora-gold bg-velora-gold/15 text-velora-textPrimary" : "border-white/10 text-velora-textSecondary hover:border-white/25"}`}>
                {item.label}{item.items.length > 0 ? ` · ${item.items.length}` : ""}
              </button>
            ))}
          </div>
          {current && current.items.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {current.items.map((person) => (
                <div key={person.id} className="space-y-1">
                  <PersonTile person={person} />
                  <p className="px-1 text-[11px] text-velora-textMuted">{person.when}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/15 p-8 text-center">
              {tab === "VISITORS" && data.browseInvisibly ? (
                <p className="text-sm text-velora-textSecondary">You browse invisibly, so visitors are hidden for you too. Change it in <Link href="/settings" className="text-velora-gold underline">Settings → Privacy</Link>.</p>
              ) : (
                <>
                  <h2 className="font-serif text-xl font-bold text-velora-textPrimary">{tab === "MUTUAL" ? "No matches yet" : tab === "INTERESTED" ? "Nobody yet" : "No visitors yet"}</h2>
                  <p className="mt-2 text-sm text-velora-textSecondary">A photo, your desires and a plan for tonight get you noticed faster.</p>
                  <div className="mt-4 flex justify-center gap-4 text-sm font-semibold"><Link href="/people" className="text-velora-gold underline">Find people</Link><Link href="/tonight/new" className="text-velora-gold underline">Post a plan</Link></div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
