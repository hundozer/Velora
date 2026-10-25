"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Person } from "@/components/people/PersonTile";
import { IntroductionSpread } from "@/components/people/IntroductionSpread";
import { PeopleIndex } from "@/components/people/PeopleIndex";
import { DEFAULT_FILTERS, FilterSentence, FilterSheet, type Filters } from "@/components/people/PeopleFilters";
import { MAX_DESIRE_FILTERS, POSITIVE_STATES } from "@/lib/desires.mjs";
import { parsePeopleFilters } from "@/lib/people.mjs";
import { takeSnapshot, writeSnapshot } from "@/lib/peopleSession.mjs";
import { useDarkNav } from "@/lib/ui/navTone";

type View = "introductions" | "everyone";
type Extras = { introductions: Person[] | null };

/** Reads filters from the page URL with the same validation the discovery API applies. */
function filtersFromParams(params: URLSearchParams): Filters {
  const parsed = parsePeopleFilters(params);
  return { who: parsed.who, minAge: parsed.minAge, maxAge: parsed.maxAge, withinKm: parsed.withinKm, desires: parsed.desires, hasPhoto: parsed.hasPhoto, verified: parsed.verified, q: parsed.q ?? "" };
}

function filterParams(filters: Filters) {
  const params = new URLSearchParams();
  if (filters.who.length) params.set("who", filters.who.join(","));
  if (filters.minAge !== 18) params.set("minAge", String(filters.minAge));
  if (filters.maxAge !== 99) params.set("maxAge", String(filters.maxAge));
  if (filters.withinKm) params.set("withinKm", String(filters.withinKm));
  if (filters.desires.length) params.set("desires", filters.desires.join(","));
  if (filters.hasPhoto) params.set("hasPhoto", "true");
  if (filters.verified) params.set("verified", "true");
  if (filters.q.trim().length >= 2) params.set("q", filters.q.trim());
  return params;
}

/** The page URL: filters plus which view is showing. */
function toQuery(filters: Filters, view: View) {
  const params = filterParams(filters);
  if (view === "everyone") params.set("view", "everyone");
  return params.toString();
}

async function fetchPeople(filters: Filters, cursor?: string | null): Promise<{ profiles: Person[]; nextCursor: string | null }> {
  const params = filterParams(filters);
  params.set("sort", "activity");
  if (cursor) params.set("cursor", cursor);
  const response = await fetch(`/api/discovery/profiles?${params.toString()}`, { credentials: "same-origin", cache: "no-store" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "People could not be loaded.");
  return { profiles: payload.profiles || [], nextCursor: payload.nextCursor || null };
}

async function fetchIntroductions(): Promise<Person[]> {
  const response = await fetch("/api/discovery/introductions", { credentials: "same-origin", cache: "no-store" });
  if (!response.ok) return [];
  const payload = await response.json().catch(() => ({}));
  return payload.introductions || [];
}

function ModeSwitch({ view, onChange, dark }: { view: View; onChange: (view: View) => void; dark: boolean }) {
  const item = (value: View, label: string) => (
    <button type="button" aria-pressed={view === value} onClick={() => onChange(value)} className={`min-h-11 border-b-2 pb-0.5 text-[15px] transition-colors ${view === value ? `border-velora-copper font-semibold ${dark ? "text-velora-onPhoto md:text-velora-ink" : "text-velora-ink"}` : `border-transparent ${dark ? "text-velora-onPhoto/75 hover:text-velora-onPhoto md:text-velora-muted md:hover:text-velora-ink" : "text-velora-muted hover:text-velora-ink"}`}`}>{label}</button>
  );
  return <nav aria-label="People view" className="flex items-center gap-5">{item("introductions", "Introductions")}{item("everyone", "Everyone")}</nav>;
}

/**
 * People (approved v33): Introductions first — up to five full-bleed spreads — flowing
 * into "Everyone nearby", a compact index grouped by activity with filters as a sentence.
 * Filters and the view live in the URL; coming back from a profile restores the place.
 */
export function MemberPeople() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialParams = React.useMemo(() => new URLSearchParams(searchParams?.toString() ?? ""), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [filters, setFilters] = React.useState<Filters>(() => filtersFromParams(new URLSearchParams(searchParams?.toString() ?? "")));
  const [view, setView] = React.useState<View>(() => initialParams.get("view") === "everyone" ? "everyone" : "introductions");
  const [people, setPeople] = React.useState<Person[] | null>(null);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState("");
  const [introductions, setIntroductions] = React.useState<Person[] | null>(null);
  const [sheet, setSheet] = React.useState<{ open: boolean; section: string }>({ open: false, section: "who" });
  const [sharedDesires, setSharedDesires] = React.useState<string[]>([]);
  const [spreadsVisible, setSpreadsVisible] = React.useState(false);
  const spreads = React.useRef<HTMLDivElement>(null);

  const filtersActive = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);
  const showIntroductions = view === "introductions" && (introductions?.length ?? 0) > 0;
  const firstLoad = React.useRef(true);
  const restoredQuery = React.useRef<string | null>(null);
  const introductionsRestored = React.useRef(false);
  const latest = React.useRef({ filters, people, cursor, introductions });
  latest.current = { filters, people, cursor, introductions };
  useDarkNav(showIntroductions && spreadsVisible);

  /** Remembers loaded people, introductions and scroll position before leaving for a profile. */
  const saveSnapshot = React.useCallback(() => {
    const { filters: current, people: loaded, cursor: next, introductions: intros } = latest.current;
    if (loaded) writeSnapshot(window.sessionStorage, filterParams(current).toString(), { people: loaded, cursor: next, rails: { introductions: intros }, scrollY: window.scrollY });
  }, []);

  // Save when following any in-app link (a profile, Tonight, Messages…), not on reload,
  // so coming back restores the place while a deliberate reload fetches fresh results.
  React.useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement | null)?.closest?.("a[href^='/']");
      if (link && !link.getAttribute("href")?.startsWith("/people")) saveSnapshot();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [saveSnapshot]);

  React.useEffect(() => {
    const pageQuery = toQuery(filters, view);
    router.replace(pageQuery ? `/people?${pageQuery}` : "/people", { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, view]);

  React.useEffect(() => {
    const query = filterParams(filters).toString();
    if (firstLoad.current) {
      firstLoad.current = false;
      // Coming back from a profile: restore the same people and scroll position once.
      const snapshot = takeSnapshot<Person, Extras>(window.sessionStorage, query);
      if (snapshot) {
        restoredQuery.current = query;
        setPeople(snapshot.people);
        setCursor(snapshot.cursor);
        if (snapshot.rails?.introductions) { setIntroductions(snapshot.rails.introductions); introductionsRestored.current = true; }
        requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, snapshot.scrollY)));
        return;
      }
    }
    // Effects can run twice for the same filters (React Strict Mode); keep restored results.
    if (restoredQuery.current === query) return;
    restoredQuery.current = null;
    let cancelled = false;
    setPeople(null);
    setError("");
    fetchPeople(filters)
      .then((result) => { if (!cancelled) { setPeople(result.profiles); setCursor(result.nextCursor); } })
      .catch((cause) => { if (!cancelled) { setError(cause.message); setPeople([]); } });
    return () => { cancelled = true; };
  }, [filters]);

  React.useEffect(() => {
    if (introductionsRestored.current) return;
    let cancelled = false;
    fetchIntroductions().then((list) => { if (!cancelled) setIntroductions(list); });
    fetch("/api/desires/me", { credentials: "same-origin", cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((mine) => {
        const wanted = (mine?.selections || []).filter((row: { state: string }) => POSITIVE_STATES.includes(row.state as never)).map((row: { desire_id: string }) => row.desire_id).slice(0, MAX_DESIRE_FILTERS);
        if (!cancelled) setSharedDesires(wanted);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // The bottom navigation turns dark while an introduction fills the bottom of the screen.
  React.useEffect(() => {
    const node = spreads.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setSpreadsVisible(entry.isIntersecting), { rootMargin: "-90% 0px 0px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [showIntroductions]);

  const loadMore = React.useCallback(async () => {
    const { cursor: next, filters: current } = latest.current;
    if (!next || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await fetchPeople(current, next);
      setPeople((existing) => [...(existing || []), ...result.profiles.filter((person) => !(existing || []).some((known) => known.id === person.id))]);
      setCursor(result.nextCursor);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "More people could not be loaded.");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore]);

  const onSearch = React.useCallback((q: string) => setFilters((current) => ({ ...current, q })), []);
  const scrollToId = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const switchView = (next: View) => { setView(next); window.scrollTo({ top: 0 }); };
  const darkHeader = showIntroductions;

  return (
    <div className="min-h-screen bg-velora-surface pb-24 md:pb-16">
      <header className={`z-20 mx-auto flex ${showIntroductions ? "max-w-5xl" : "max-w-2xl"} items-center justify-between px-5 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-8 ${darkHeader ? "absolute inset-x-0 top-0 md:static md:pt-6" : "pt-4 md:pt-8"}`}>
        <Link href="/" className={`font-display text-[28px] leading-none md:invisible ${darkHeader ? "text-velora-onPhoto md:text-velora-ink" : "text-velora-ink"}`}>Intimo</Link>
        <ModeSwitch view={view} onChange={switchView} dark={darkHeader} />
      </header>
      <div className={`mx-auto max-w-2xl px-5 py-3 text-sm sm:px-8 ${showIntroductions?"relative z-20 mt-16 text-velora-onPhoto md:mt-0 md:text-velora-ink":"text-velora-ink"}`}><Link href="/stories" className="inline-flex min-h-11 items-center underline underline-offset-4">Stories · see what people are sharing</Link></div>

      {showIntroductions && introductions && (
        <div ref={spreads} className="mx-auto max-w-5xl md:space-y-6 md:px-8 md:pt-4">
          {introductions.map((person, index) => (
            <div key={person.id} id={`intro-${index}`}>
              <IntroductionSpread person={person} priority={index === 0} next={introductions[index + 1] ?? null} onNext={() => scrollToId(index + 1 < introductions.length ? `intro-${index + 1}` : "everyone-nearby")} />
            </div>
          ))}
        </div>
      )}

      <section id="everyone-nearby" aria-label="Everyone nearby" className="mx-auto max-w-2xl scroll-mt-4 px-5 pt-8 sm:px-8 md:pt-12">
        {showIntroductions && <h1 className="mb-4 font-display text-[44px] leading-[1.02] text-velora-ink">Everyone nearby</h1>}
        {!showIntroductions && <h1 className="sr-only">People</h1>}
        <FilterSentence filters={filters} onOpen={(section) => setSheet({ open: true, section })} onSearch={onSearch} />

        <div className="mt-6">
          {error && <p role="alert" className="mb-4 border-l-2 border-velora-crimson pl-4 text-[15px] text-velora-crimson">{error}</p>}
          {people !== null && people.length === 0 ? (
            <div className="py-10">
              <h2 className="font-display text-[32px] leading-tight text-velora-ink">{filtersActive ? "Nobody here with these filters yet" : "Members are on their way"}</h2>
              <p className="mt-3 text-[16px] text-velora-ink2">{filtersActive ? "Try a wider distance or fewer filters." : "Post a plan for tonight so new members find you first."}</p>
              {filtersActive
                ? <button type="button" onClick={() => setFilters(DEFAULT_FILTERS)} className="mt-5 min-h-11 text-[16px] font-semibold text-velora-ink underline underline-offset-4">Show everyone</button>
                : <Link href="/tonight/new" className="mt-5 inline-flex min-h-11 items-center text-[16px] font-semibold text-velora-ink underline underline-offset-4">Post a plan</Link>}
            </div>
          ) : (
            <PeopleIndex people={people} loading={people === null} hasMore={Boolean(cursor)} loadingMore={loadingMore} onLoadMore={loadMore} endNote={filters.withinKm ? "Widen the distance to see more of Prague." : null} />
          )}
        </div>
      </section>

      <FilterSheet open={sheet.open} section={sheet.section} initial={filters} sharedDesires={sharedDesires} onClose={() => setSheet((current) => ({ ...current, open: false }))} onApply={(next) => { setFilters(next); setSheet((current) => ({ ...current, open: false })); if (view === "introductions" && introductions?.length) requestAnimationFrame(() => scrollToId("everyone-nearby")); }} />
    </div>
  );
}
