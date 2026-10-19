"use client";

import React from "react";
import Link from "next/link";
import { Portrait } from "@/components/media/Portrait";
import { ACTIVITY_GROUPS } from "@/lib/people.mjs";
import { metaLine } from "@/lib/peopleCopy.mjs";
import type { Person } from "@/components/people/PersonTile";

/** One line of the Everyone index: small portrait (or monogram), name, age · area. */
export function IndexRow({ person }: { person: Person }) {
  return (
    <li className="[content-visibility:auto] [contain-intrinsic-size:auto_84px]">
      <Link href={`/profile/${person.id}`} className="group flex min-h-[84px] items-center gap-4 py-3 outline-offset-4">
        <Portrait src={person.avatarUrl} name={person.displayName} sizes="48px" className="h-[60px] w-12 shrink-0" monogramClassName="text-2xl" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-[24px] leading-tight text-velora-ink group-hover:text-velora-copperInk">{person.displayName}</span>
          <span className="block truncate text-[14px] text-velora-muted">{metaLine(person) || " "}</span>
        </span>
        {person.presence === "ONLINE" && <span className="h-2 w-2 shrink-0 rounded-full bg-velora-copper" aria-label="Here now" role="img" />}
      </Link>
    </li>
  );
}

function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <ul aria-hidden className="divide-y divide-transparent">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="flex min-h-[84px] items-center gap-4 py-3">
          <span className="h-[60px] w-12 shrink-0 bg-velora-sunken" />
          <span className="flex-1 space-y-2"><span className="block h-5 w-32 bg-velora-sunken" /><span className="block h-3.5 w-24 bg-velora-sunken/70" /></span>
        </li>
      ))}
    </ul>
  );
}

/**
 * The Everyone index, grouped by activity: Here now, Earlier today, This week, and
 * "Other people nearby" for everyone whose activity is hidden or quiet — no activity
 * is shown for them. Loads more as you scroll; group headings stay pinned.
 */
export function PeopleIndex({ people, loading, hasMore, loadingMore, onLoadMore, endNote }: {
  people: Person[] | null; loading: boolean; hasMore: boolean; loadingMore: boolean; onLoadMore: () => void; endNote?: React.ReactNode;
}) {
  const sentinel = React.useRef<HTMLDivElement>(null);
  const [farDown, setFarDown] = React.useState(false);

  React.useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasMore || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) onLoadMore(); }, { rootMargin: "600px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore, people?.length]);

  React.useEffect(() => {
    const onScroll = () => setFarDown(window.scrollY > 1400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (loading || people === null) return <SkeletonRows count={5} />;

  const groups = ACTIVITY_GROUPS.map((group) => ({ ...group, people: people.filter((person) => (person.presence ?? null) === group.presence) })).filter((group) => group.people.length > 0);

  return (
    <div>
      {groups.map((group) => (
        <section key={group.label} aria-label={group.label}>
          <h3 className="sticky top-0 z-10 -mx-5 flex items-baseline justify-between bg-velora-surface/95 px-5 py-3 backdrop-blur-sm sm:-mx-8 sm:px-8 md:top-16 lg:top-20">
            <span className="font-display text-[22px] italic text-velora-copperInk">{group.label}</span>
            {farDown && <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="text-[14px] text-velora-ink2 underline underline-offset-4">Back to top</button>}
          </h3>
          <ul>{group.people.map((person) => <IndexRow key={person.id} person={person} />)}</ul>
        </section>
      ))}
      {loadingMore && <SkeletonRows />}
      <div ref={sentinel} aria-hidden className="h-px" />
      {hasMore && !loadingMore && (
        <button type="button" onClick={onLoadMore} className="mt-2 min-h-11 text-[15px] text-velora-ink2 underline underline-offset-4">Show more</button>
      )}
      {!hasMore && endNote && <p className="mt-6 text-[15px] text-velora-ink2">{endNote}</p>}
    </div>
  );
}
