"use client";

import React from "react";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import { PersonTile, type Person } from "@/components/people/PersonTile";
import { PlanCard, type Plan } from "@/components/plans/PlanCard";
import { DESIRES, MAX_DESIRE_FILTERS, POSITIVE_STATES } from "@/lib/desires.mjs";
import { DISTANCE_OPTIONS, WHO_OPTIONS } from "@/lib/people.mjs";

type Filters = { who: string[]; minAge: number; maxAge: number; withinKm: number | null; desires: string[]; hasPhoto: boolean; verified: boolean; online: boolean };
const DEFAULT_FILTERS: Filters = { who: [], minAge: 18, maxAge: 99, withinKm: null, desires: [], hasPhoto: false, verified: false, online: false };

function toQuery(filters: Filters, extra: Record<string, string> = {}) {
  const params = new URLSearchParams(extra);
  if (filters.who.length) params.set("who", filters.who.join(","));
  if (filters.minAge !== 18) params.set("minAge", String(filters.minAge));
  if (filters.maxAge !== 99) params.set("maxAge", String(filters.maxAge));
  if (filters.withinKm) params.set("withinKm", String(filters.withinKm));
  if (filters.desires.length) params.set("desires", filters.desires.join(","));
  if (filters.hasPhoto) params.set("hasPhoto", "true");
  if (filters.verified) params.set("verified", "true");
  if (filters.online) params.set("active", "ONLINE");
  return params.toString();
}

async function fetchPeople(query: string): Promise<{ profiles: Person[]; nextCursor: string | null }> {
  const response = await fetch(`/api/discovery/profiles?${query}`, { credentials: "same-origin", cache: "no-store" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "People could not be loaded.");
  return { profiles: payload.profiles || [], nextCursor: payload.nextCursor || null };
}

function Rail({ title, people, href }: { title: string; people: Person[]; href?: string }) {
  if (people.length === 0) return null; // Empty rails hide; never show a zero.
  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-velora-textSecondary">{title}</h2>
        {href && <Link href={href} className="text-xs text-velora-gold">See all</Link>}
      </div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">{people.map((person) => <PersonTile key={person.id} person={person} compact />)}</div>
    </section>
  );
}

/** People v3 (P1-05): rails for a low-density city, then the filtered grid. */
export function MemberPeople() {
  const [filters, setFilters] = React.useState<Filters>(DEFAULT_FILTERS);
  const [draft, setDraft] = React.useState<Filters>(DEFAULT_FILTERS);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [people, setPeople] = React.useState<Person[] | null>(null);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState("");
  const [rails, setRails] = React.useState<{ activeTitle: string; active: Person[]; fresh: Person[]; shared: Person[]; plans: Plan[] }>({ activeTitle: "Online now", active: [], fresh: [], shared: [], plans: [] });

  const filtersActive = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  React.useEffect(() => {
    let cancelled = false;
    setPeople(null);
    setError("");
    fetchPeople(toQuery(filters))
      .then((result) => { if (!cancelled) { setPeople(result.profiles); setCursor(result.nextCursor); } })
      .catch((cause) => { if (!cancelled) { setError(cause.message); setPeople([]); } });
    return () => { cancelled = true; };
  }, [filters]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      // Widen the recency window until something shows, so a quiet hour never looks empty.
      let active: Person[] = [];
      let activeTitle = "Online now";
      for (const [window, title] of [["ONLINE", "Online now"], ["DAY", "Active today"], ["WEEK", "Active this week"]] as const) {
        active = (await fetchPeople(`active=${window}&limit=12`).catch(() => ({ profiles: [] as Person[] }))).profiles;
        activeTitle = title;
        if (active.length > 0) break;
      }
      const fresh = (await fetchPeople("new=true&limit=12").catch(() => ({ profiles: [] as Person[] }))).profiles;
      const mine = await fetch("/api/desires/me", { credentials: "same-origin", cache: "no-store" }).then((response) => response.ok ? response.json() : null).catch(() => null);
      const wanted = (mine?.selections || []).filter((row: { state: string }) => POSITIVE_STATES.includes(row.state as never)).map((row: { desire_id: string }) => row.desire_id).slice(0, MAX_DESIRE_FILTERS);
      const shared = wanted.length ? (await fetchPeople(`desires=${wanted.join(",")}&limit=12`).catch(() => ({ profiles: [] as Person[] }))).profiles : [];
      const plans = await fetch("/api/dating-ads", { credentials: "same-origin", cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((payload) => (payload?.plans || []).filter((plan: Plan) => !plan.isMine).slice(0, 3)).catch(() => []);
      if (!cancelled) setRails({ activeTitle, active, fresh, shared, plans });
    })();
    return () => { cancelled = true; };
  }, []);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await fetchPeople(toQuery(filters, { cursor }));
      setPeople((current) => [...(current || []), ...result.profiles.filter((person) => !(current || []).some((known) => known.id === person.id))]);
      setCursor(result.nextCursor);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "More people could not be loaded.");
    } finally {
      setLoadingMore(false);
    }
  }

  const chip = (on: boolean) => `min-h-9 rounded-full border px-3 text-xs transition ${on ? "border-velora-gold bg-velora-gold/15 text-velora-textPrimary" : "border-ink/10 text-velora-textSecondary hover:border-ink/25"}`;
  const toggle = (list: string[], value: string, max = 99) => list.includes(value) ? list.filter((item) => item !== value) : list.length >= max ? list : [...list, value];

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 pb-24 pt-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-velora-gold">People</p>
          <h1 className="font-serif font-bold text-velora-textPrimary text-5xl leading-[1.02] sm:text-6xl">Who&apos;s around</h1>
        </div>
        <button type="button" onClick={() => { setDraft(filters); setSheetOpen(true); }} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/15 px-4 text-sm font-semibold text-velora-textPrimary hover:border-velora-gold/50">
          <SlidersHorizontal className="h-4 w-4" aria-hidden />Filters{filtersActive ? " ·" : ""}
        </button>
      </header>

      {!filtersActive && (
        <div className="space-y-6">
          <Rail title={rails.activeTitle} people={rails.active} />
          <Rail title="New in Prague" people={rails.fresh} />
          <Rail title="Shares your desires" people={rails.shared} />
          {rails.plans.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-baseline justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-velora-textSecondary">Tonight near you</h2>
                <Link href="/tonight" className="text-xs text-velora-gold">See all</Link>
              </div>
              <div className="grid gap-3 md:grid-cols-3">{rails.plans.map((plan) => <PlanCard key={plan.id} plan={plan} />)}</div>
            </section>
          )}
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-velora-textSecondary">{filtersActive ? "Matching your filters" : "Everyone"}</h2>
          {filtersActive && <button type="button" onClick={() => setFilters(DEFAULT_FILTERS)} className="text-xs text-velora-textMuted underline">Clear filters</button>}
        </div>
        {error && <p role="alert" className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-700">{error}</p>}
        {people === null ? (
          <p className="text-sm text-velora-textMuted">Loading…</p>
        ) : people.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-ink/15 p-8 text-center">
            <h3 className="font-serif text-xl font-bold text-velora-textPrimary">{filtersActive ? "Nobody matches just yet" : "Members are on their way"}</h3>
            <p className="mt-2 text-sm text-velora-textSecondary">{filtersActive ? "Try a wider distance or fewer filters." : "Post a plan for tonight so new members find you first."}</p>
            {filtersActive
              ? <button type="button" onClick={() => setFilters(DEFAULT_FILTERS)} className="mt-4 text-sm font-semibold text-velora-gold underline">Clear filters</button>
              : <Link href="/tonight/new" className="mt-4 inline-block text-sm font-semibold text-velora-gold underline">Post a plan</Link>}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{people.map((person) => <PersonTile key={person.id} person={person} />)}</div>
            {cursor && <button type="button" onClick={loadMore} disabled={loadingMore} className="mx-auto block min-h-11 rounded-full border border-ink/15 px-6 text-sm text-velora-textSecondary disabled:opacity-50">{loadingMore ? "Loading…" : "Show more"}</button>}
          </>
        )}
      </section>

      {sheetOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 md:items-center" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="max-h-[85vh] w-full max-w-lg space-y-5 overflow-y-auto rounded-t-3xl border border-ink/10 bg-velora-bg p-5 md:rounded-3xl">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-3xl font-bold text-velora-textPrimary">Filters</h2>
              <button type="button" onClick={() => setSheetOpen(false)} aria-label="Close filters" className="rounded-full p-2 text-velora-textMuted hover:text-velora-textPrimary"><X className="h-5 w-5" /></button>
            </div>
            <fieldset className="space-y-2"><legend className="text-xs font-semibold uppercase tracking-wider text-velora-textSecondary">Who</legend>
              <div className="flex flex-wrap gap-2">{WHO_OPTIONS.map((item) => <button key={item.value} type="button" aria-pressed={draft.who.includes(item.value)} onClick={() => setDraft({ ...draft, who: toggle(draft.who, item.value) })} className={chip(draft.who.includes(item.value))}>{item.label}</button>)}</div>
            </fieldset>
            <fieldset className="space-y-2"><legend className="text-xs font-semibold uppercase tracking-wider text-velora-textSecondary">Age</legend>
              <div className="flex items-center gap-3 text-sm text-velora-textSecondary">
                <input type="number" min={18} max={99} value={draft.minAge} onChange={(event) => setDraft({ ...draft, minAge: Math.max(18, Number(event.target.value) || 18) })} className="w-20 rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-velora-textPrimary" aria-label="Minimum age" />
                to
                <input type="number" min={18} max={99} value={draft.maxAge} onChange={(event) => setDraft({ ...draft, maxAge: Math.min(99, Number(event.target.value) || 99) })} className="w-20 rounded-xl border border-ink/10 bg-ink/5 px-3 py-2 text-velora-textPrimary" aria-label="Maximum age" />
              </div>
            </fieldset>
            <fieldset className="space-y-2"><legend className="text-xs font-semibold uppercase tracking-wider text-velora-textSecondary">Distance</legend>
              <div className="flex flex-wrap gap-2">
                <button type="button" aria-pressed={draft.withinKm === null} onClick={() => setDraft({ ...draft, withinKm: null })} className={chip(draft.withinKm === null)}>Anywhere</button>
                {DISTANCE_OPTIONS.map((item) => <button key={item.km} type="button" aria-pressed={draft.withinKm === item.km} onClick={() => setDraft({ ...draft, withinKm: item.km })} className={chip(draft.withinKm === item.km)}>{item.label}</button>)}
              </div>
              <p className="text-[11px] text-velora-textMuted">Measured between Prague areas, never exact positions.</p>
            </fieldset>
            <fieldset className="space-y-2"><legend className="text-xs font-semibold uppercase tracking-wider text-velora-textSecondary">Into <span className="font-normal normal-case tracking-normal text-velora-textMuted">· up to {MAX_DESIRE_FILTERS}</span></legend>
              <div className="flex flex-wrap gap-2">{DESIRES.map((desire) => <button key={desire.id} type="button" aria-pressed={draft.desires.includes(desire.id)} onClick={() => setDraft({ ...draft, desires: toggle(draft.desires, desire.id, MAX_DESIRE_FILTERS) })} className={chip(draft.desires.includes(desire.id))}>{desire.label}</button>)}</div>
            </fieldset>
            <fieldset className="space-y-2"><legend className="text-xs font-semibold uppercase tracking-wider text-velora-textSecondary">Only show</legend>
              <div className="flex flex-wrap gap-2">
                <button type="button" aria-pressed={draft.online} onClick={() => setDraft({ ...draft, online: !draft.online })} className={chip(draft.online)}>Online now</button>
                <button type="button" aria-pressed={draft.hasPhoto} onClick={() => setDraft({ ...draft, hasPhoto: !draft.hasPhoto })} className={chip(draft.hasPhoto)}>With photo</button>
                <button type="button" aria-pressed={draft.verified} onClick={() => setDraft({ ...draft, verified: !draft.verified })} className={chip(draft.verified)}>Verified</button>
              </div>
            </fieldset>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setDraft(DEFAULT_FILTERS)} className="min-h-11 flex-1 rounded-full border border-ink/15 text-sm text-velora-textSecondary">Reset</button>
              <button type="button" onClick={() => { setFilters({ ...draft, maxAge: Math.max(draft.minAge, draft.maxAge) }); setSheetOpen(false); }} className="min-h-11 flex-1 rounded-full bg-gold-gradient text-sm font-bold text-velora-bg">Show people</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
