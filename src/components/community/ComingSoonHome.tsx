"use client";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowDown, EyeOff, KeyRound, Sparkles } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { HandUnderline, PaperCard } from "@/components/brand/HandDrawn";
import { SaintsIllustration } from "@/components/brand/Illustrations";
import { InvitationRequestForm } from "@/components/community/InvitationRequestForm";

// Only what the product does today (docs/brand/BRAND.md: never promise more).
const PROMISES = [
  { icon: KeyRound, title: "By invitation", body: "Every member is invited or personally approved by us. No open door, no strangers looking in." },
  { icon: EyeOff, title: "Seen only when you choose", body: "Your private albums stay closed until you say yes. Change your mind, and the door closes again." },
  { icon: Sparkles, title: "Your rules", body: "Say what draws you in and what's off limits. Choose who may write to you first." },
] as const;

const delay = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

/**
 * Front page while Coming Soon is on (src/lib/comingSoon.mjs): what Intimo is,
 * the invitation request form, and a way in for members. No photos, no counts.
 * Layout follows the Homepage board of the "Intimo brand upgrade" design (docs/brand/BRAND.md).
 */
export function ComingSoonHome() {
  const { t } = useTranslation();
  return (
    <div className="intimo-grain">
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <section className="grid min-h-[calc(100svh-9rem)] items-center gap-14 py-14 sm:py-20 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-20" aria-labelledby="coming-soon-title">
        <div className="flex min-w-0 flex-col items-start gap-7">
          <p className="intimo-reveal text-[11px] font-semibold uppercase tracking-[0.24em] text-velora-muted">{t("Opening soon, by invitation")}<span aria-hidden> · </span>{t("Prague · 18+")}</p>
          <h1 id="coming-soon-title" className="font-serif text-[clamp(3.25rem,8vw,5.6rem)] leading-[0.95]">
            <span className="intimo-reveal block" style={delay(300)}>{t("Not for everyone.")}</span>
            <span className="intimo-reveal block italic text-velora-warm" style={delay(900)}>{t("Maybe for you.")}</span>
          </h1>
          <HandUnderline className="intimo-reveal -mt-2 w-[240px]" />
          <div className="intimo-reveal max-w-[30rem] space-y-3" style={delay(1300)}>
            <p className="text-[17px] leading-relaxed text-velora-ink2">{t("A private circle in Prague for adults who know what they want, or are curious to find out. You decide who sees you, who writes to you, and how far it goes.")}</p>
            <p className="font-serif text-2xl text-velora-ink">{t("Boundaries first. Then chemistry.")}</p>
          </div>
          <div className="intimo-reveal flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-8" style={delay(1600)}>
            <a href="#request-invitation" className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-velora-warm px-7 text-base font-semibold text-velora-paper transition hover:bg-velora-warmHover">{t("Ask to come in")}<ArrowDown className="h-5 w-5" aria-hidden /></a>
            <p className="text-sm text-velora-ink2">{t("Already inside?")}{" "}<a href="/auth/login" className="font-semibold text-velora-ink underline decoration-velora-ink/40 underline-offset-4 hover:decoration-velora-ink">{t("Log in")}</a></p>
          </div>
          <p className="intimo-reveal flex items-start gap-2.5 text-[13px] leading-relaxed text-velora-muted" style={delay(1800)}><span aria-hidden className="mt-[0.45em] h-2 w-2 shrink-0 rounded-full bg-velora-accent" />{t("Invitation only · photos without location data · you choose who may write to you")}</p>
        </div>
        <figure className="intimo-reveal mx-auto w-full max-w-md lg:max-w-none" style={delay(600)}>
          <PaperCard>
            <SaintsIllustration label={t("Two saints in profile with their eyes closed, almost kissing, their halos overlapping")} className="h-auto w-full" />
          </PaperCard>
          <figcaption className="mt-4 font-serif text-xl italic text-velora-muted">{t("Blessed are those who ask.")}</figcaption>
        </figure>
      </section>

      <ul className="grid gap-10 border-t border-velora-line py-14 sm:grid-cols-3 sm:gap-8 sm:py-16">
        {PROMISES.map(({ icon: Icon, title, body }) => (
          <li key={title}>
            <Icon className="h-6 w-6 text-velora-ink2" aria-hidden />
            <h2 className="mt-4 font-serif text-2xl text-velora-ink">{t(title)}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-velora-ink2">{t(body)}</p>
          </li>
        ))}
      </ul>

      <section id="request-invitation" className="grid scroll-mt-24 gap-10 border-t border-velora-line py-14 sm:py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16" aria-labelledby="request-title">
        <div>
          <h2 id="request-title" className="font-serif text-[clamp(2.75rem,5.5vw,4.25rem)] leading-[0.95]">{t("Knock.")}</h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-velora-ink">{t("We're letting in our first 100 members, one at a time.")}</p>
          <p className="mt-4 max-w-md text-base leading-relaxed text-velora-ink2">{t("Tell us a little about yourself. We read every request ourselves, and if it feels right, your invitation arrives by email. Your request stays between you and us.")}</p>
          <p className="mt-8 text-sm text-velora-ink2">{t("Have an invitation?")}{" "}<Link href="/register" className="font-semibold text-velora-ink underline decoration-velora-ink/40 underline-offset-4 hover:decoration-velora-ink">{t("Join Intimo")}</Link></p>
        </div>
        <InvitationRequestForm />
      </section>
    </div>
    </div>
  );
}
