"use client";

import { useTranslation } from "@/context/LanguageContext";
import React from "react";
import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { Portrait, monogram } from "@/components/media/Portrait";
import { StoryAvatar } from "@/components/stories/StoryAvatar";
import { FoundingMemberBadge } from "@/components/community/FoundingMemberBadge";
import { possessive, statusLine, ownWords } from "@/lib/peopleCopy.mjs";
import type { Person } from "@/components/people/PersonTile";

/**
 * One introduction as a full-bleed spread (approved v33): photograph, name at display
 * size, the member's own words, "Say hello" and their portrait. Without a photograph the
 * spread is typographic — own words as the headline over a soft copper glow.
 */
export function IntroductionSpread({ person, next, priority = false, onNext }: { person: Person; next?: Person | null; priority?: boolean; onNext?: () => void }) {
  const { t } = useTranslation();
  const words = ownWords(person);
  const status = statusLine(person, t);
  const hasPhoto = Boolean(person.avatarUrl);
  const portraitLabel = t(`${possessive(person)[0].toUpperCase()}${possessive(person).slice(1)} portrait`);
  const hello = person.isCoupleProfile ? t("Write to them") : t("Say hello");

  return (
    <article aria-label={t("Introduction: {displayName}", { displayName: person.displayName })} className="relative isolate flex min-h-[clamp(440px,68svh,680px)] flex-col justify-end overflow-hidden bg-velora-night text-velora-onPhoto md:min-h-[min(82vh,760px)] md:rounded-[28px]">
      {hasPhoto ? (
        <>
          <Portrait src={person.avatarUrl} name={person.displayName} priority={priority} dominantColor="#191c20" sizes="(min-width: 768px) 50vw, 100vw" className="absolute inset-0 -z-10 h-full w-full md:left-auto md:w-1/2" monogramClassName="text-[10rem]" />
          {/* Scrim keeps the words at 4.5:1 or better over any photograph. */}
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-velora-night from-[8%] via-velora-night/75 via-[42%] to-velora-night/0 md:bg-gradient-to-r md:from-velora-night md:from-[46%] md:via-velora-night/40 md:via-[54%] md:to-transparent" />
          {/* And the page header (wordmark, Introductions / Everyone) over the top of the photo. */}
          <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-36 bg-gradient-to-b from-velora-night/75 to-transparent md:hidden" />
        </>
      ) : (
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[38%] h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-velora-accent/25 blur-3xl" />
          <span className="absolute right-6 top-24 font-display text-[9rem] italic leading-none text-velora-onPhoto/[0.07] md:right-16 md:top-16 md:text-[16rem]">{monogram(person.displayName)}</span>
        </div>
      )}

      <div className="px-5 pb-7 pt-12 sm:px-10 md:max-w-[52%] md:pb-14 md:pl-14 md:pt-28">
        <div className="mb-5"><StoryAvatar ownerId={person.id} name={person.displayName} src={person.avatarUrl} size={64}/></div>
        {hasPhoto || !words ? (
          <>
            {status && (
              <p className="flex items-center gap-2 text-[14px] text-velora-onPhoto/85">
                {person.presence === "ONLINE" && <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-velora-accentHover motion-reduce:animate-none" />}
                {t(status)}
              </p>
            )}
            <h2 className="mt-2 break-words font-display text-[clamp(3.25rem,15vw,5.75rem)] leading-[0.98] tracking-[-0.01em] md:text-[clamp(4.5rem,8vw,7rem)]">{person.displayName}</h2>
            {words && <p className="mt-5 max-w-md font-display text-[clamp(1.4rem,6vw,1.75rem)] italic leading-[1.2] text-velora-onPhoto/95">&ldquo;{words}&rdquo;</p>}
          </>
        ) : (
          <>
            <p className="max-w-lg font-display text-[clamp(2rem,9vw,3rem)] italic leading-[1.1]">&ldquo;{words}&rdquo;</p>
            <p className="mt-5 text-[15px] text-velora-onPhoto/85">
              {person.displayName}{status ? ` · ${status}` : ""}. Photographs shared privately.
            </p>
          </>
        )}
        {person.foundingMember && <div className="mt-4"><FoundingMemberBadge onPhoto /></div>}
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px] md:mt-7 md:gap-x-6">
          <Link href={`/messages?user=${person.id}`} className="group inline-flex min-h-11 items-center gap-3 font-semibold text-velora-onPhoto">
            {hello}<span aria-hidden data-rule className="h-px w-8 bg-velora-onPhoto/70 transition-all group-hover:w-12" />
          </Link>
          <Link href={`/profile/${person.id}`} className="inline-flex min-h-11 items-center text-velora-onPhoto/90 underline decoration-velora-onPhoto/50 underline-offset-4 hover:decoration-velora-onPhoto">{t(portraitLabel)}</Link>
        </div>
        {next !== undefined && (
          <div className="mt-6 flex items-center justify-between border-t border-velora-onPhoto/15 pt-4 text-[14px] text-velora-onPhoto/75">
            {next ? <span>{t("Next: {displayName}", { displayName: next.displayName })}</span> : <span>{t("That was the last introduction for now.")}</span>}
            {onNext && <button type="button" onClick={onNext} aria-label={next ? t("Next: {displayName}", { displayName: next.displayName }) : t("Everyone nearby")} className="-mr-2 flex h-11 w-11 items-center justify-center text-velora-onPhoto/85 hover:text-velora-onPhoto"><ArrowDown className="h-4 w-4" aria-hidden /></button>}
          </div>
        )}
      </div>
    </article>
  );
}
