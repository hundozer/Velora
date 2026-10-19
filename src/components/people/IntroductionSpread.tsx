"use client";

import React from "react";
import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { Portrait, monogram } from "@/components/media/Portrait";
import { possessive, statusLine, ownWords } from "@/lib/peopleCopy.mjs";
import type { Person } from "@/components/people/PersonTile";

/**
 * One introduction as a full-bleed spread (approved v33): photograph, name at display
 * size, the member's own words, "Say hello" and their portrait. Without a photograph the
 * spread is typographic — own words as the headline over a soft copper glow.
 */
export function IntroductionSpread({ person, next, priority = false, onNext }: { person: Person; next?: Person | null; priority?: boolean; onNext?: () => void }) {
  const words = ownWords(person);
  const status = statusLine(person);
  const hasPhoto = Boolean(person.avatarUrl);
  const portraitLabel = `${possessive(person)[0].toUpperCase()}${possessive(person).slice(1)} portrait`;
  const hello = person.isCoupleProfile ? "Write to them" : "Say hello";

  return (
    <article aria-label={`Introduction: ${person.displayName}`} className="relative isolate flex min-h-[calc(100svh-4rem-env(safe-area-inset-bottom))] flex-col justify-end overflow-hidden bg-velora-night text-velora-paper md:min-h-[min(82vh,760px)] md:rounded-[28px]">
      {hasPhoto ? (
        <>
          <Portrait src={person.avatarUrl} name={person.displayName} priority={priority} dominantColor="#2b2420" sizes="(min-width: 768px) 50vw, 100vw" className="absolute inset-0 -z-10 h-full w-full md:left-auto md:w-1/2" monogramClassName="text-[10rem]" />
          {/* Scrim keeps the words at 4.5:1 or better over any photograph. */}
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-velora-night from-[8%] via-velora-night/75 via-[42%] to-velora-night/0 md:bg-gradient-to-r md:from-velora-night md:from-[46%] md:via-velora-night/40 md:via-[54%] md:to-transparent" />
          {/* And the page header (wordmark, Introductions / Everyone) over the top of the photo. */}
          <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-36 bg-gradient-to-b from-velora-night/75 to-transparent md:hidden" />
        </>
      ) : (
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[38%] h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-velora-copper/25 blur-3xl" />
          <span className="absolute right-6 top-24 font-display text-[9rem] italic leading-none text-velora-paper/[0.07] md:right-16 md:top-16 md:text-[16rem]">{monogram(person.displayName)}</span>
        </div>
      )}

      <div className="px-6 pb-8 pt-28 sm:px-10 md:max-w-[52%] md:pb-14 md:pl-14">
        {hasPhoto || !words ? (
          <>
            {status && (
              <p className="flex items-center gap-2 text-[14px] text-velora-paper/85">
                {person.presence === "ONLINE" && <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-velora-copperLight motion-reduce:animate-none" />}
                {status}
              </p>
            )}
            <h2 className="mt-1 break-words font-display text-[clamp(4.5rem,24vw,7rem)] leading-[0.92] tracking-[-0.01em]">{person.displayName}</h2>
            {words && <p className="mt-5 max-w-md font-display text-[clamp(1.4rem,6vw,1.75rem)] italic leading-[1.2] text-velora-paper/95">&ldquo;{words}&rdquo;</p>}
          </>
        ) : (
          <>
            <p className="max-w-lg font-display text-[clamp(2rem,9vw,3rem)] italic leading-[1.1]">&ldquo;{words}&rdquo;</p>
            <p className="mt-5 text-[15px] text-velora-paper/85">
              {person.displayName}{status ? ` · ${status}` : ""}. Photographs shared privately.
            </p>
          </>
        )}
        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-[15px]">
          <Link href={`/messages?user=${person.id}`} className="group inline-flex min-h-11 items-center gap-3 font-semibold text-velora-paper">
            {hello}<span aria-hidden data-rule className="h-px w-8 bg-velora-paper/70 transition-all group-hover:w-12" />
          </Link>
          <Link href={`/profile/${person.id}`} className="inline-flex min-h-11 items-center text-velora-paper/90 underline decoration-velora-paper/50 underline-offset-4 hover:decoration-velora-paper">{portraitLabel}</Link>
        </div>
        {next !== undefined && (
          <div className="mt-6 flex items-center justify-between border-t border-velora-paper/15 pt-4 text-[14px] text-velora-paper/75">
            {next ? <span>Next: {next.displayName}</span> : <span>That was the last introduction for now.</span>}
            {onNext && <button type="button" onClick={onNext} aria-label={next ? `Next: ${next.displayName}` : "Everyone nearby"} className="-mr-2 flex h-11 w-11 items-center justify-center text-velora-paper/85 hover:text-velora-paper"><ArrowDown className="h-4 w-4" aria-hidden /></button>}
          </div>
        )}
      </div>
    </article>
  );
}
