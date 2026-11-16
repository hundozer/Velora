"use client";
import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowDown, EyeOff, KeyRound, Sparkles } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { Logo } from "@/components/brand/Logo";
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
 */
export function ComingSoonHome() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <section className="flex min-h-[calc(100svh-9rem)] flex-col items-center justify-center py-16 text-center sm:py-24" aria-labelledby="coming-soon-title">
        <div aria-hidden className="intimo-reveal"><Logo variant="symbol" className="intimo-breathe h-24 w-auto text-velora-ink sm:h-32" /></div>
        <p className="intimo-reveal mt-10 text-xs font-semibold uppercase tracking-[0.24em] text-velora-muted" style={delay(250)}><span className="block sm:inline">{t("Opening soon, by invitation")}</span><span className="hidden sm:inline" aria-hidden> · </span><span className="mt-2 block sm:mt-0 sm:inline">{t("Prague · 18+")}</span></p>
        <h1 id="coming-soon-title" className="mt-6 font-display text-[clamp(3rem,9vw,7.5rem)] font-extrabold leading-[0.98] tracking-[-0.04em]">
          <span className="intimo-reveal block" style={delay(450)}>{t("Not for everyone.")}</span>
          <span className="intimo-reveal block text-velora-ink2" style={delay(1100)}>{t("Maybe for you.")}</span>
        </h1>
        <p className="intimo-reveal mt-8 text-xl font-semibold tracking-tight text-velora-ink sm:text-2xl" style={delay(1700)}>{t("Boundaries first. Then chemistry.")}</p>
        <p className="intimo-reveal mt-5 max-w-xl text-base leading-relaxed text-velora-ink2 sm:text-lg" style={delay(1900)}>{t("A private circle in Prague for adults who know what they want, or are curious to find out. You decide who sees you, who writes to you, and how far it goes.")}</p>
        <div className="intimo-reveal mt-10 flex flex-col items-center gap-5 sm:flex-row sm:gap-8" style={delay(2100)}>
          <a href="#request-invitation" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-velora-accent px-7 text-base font-bold text-velora-paper transition hover:bg-velora-accentHover">{t("Ask to come in")}<ArrowDown className="h-5 w-5" aria-hidden /></a>
          <p className="text-sm text-velora-ink2">{t("Already inside?")}{" "}<a href="/auth/login" className="font-semibold text-velora-ink underline decoration-velora-ink/40 underline-offset-4 hover:decoration-velora-ink">{t("Log in")}</a></p>
        </div>
      </section>

      <ul className="grid gap-10 border-t border-velora-line py-14 sm:grid-cols-3 sm:gap-8 sm:py-16">
        {PROMISES.map(({ icon: Icon, title, body }) => (
          <li key={title}>
            <Icon className="h-6 w-6 text-velora-ink2" aria-hidden />
            <h2 className="mt-4 text-lg font-bold tracking-tight text-velora-ink">{t(title)}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-velora-ink2">{t(body)}</p>
          </li>
        ))}
      </ul>

      <section id="request-invitation" className="grid scroll-mt-24 gap-10 border-t border-velora-line py-14 sm:py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16" aria-labelledby="request-title">
        <div>
          <h2 id="request-title" className="font-display text-[clamp(2.5rem,5vw,4rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">{t("Knock.")}</h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-velora-ink">{t("We're letting in our first 100 members, one at a time.")}</p>
          <p className="mt-4 max-w-md text-base leading-relaxed text-velora-ink2">{t("Tell us a little about yourself. We read every request ourselves, and if it feels right, your invitation arrives by email. Your request stays between you and us.")}</p>
          <p className="mt-8 text-sm text-velora-ink2">{t("Have an invitation?")}{" "}<Link href="/register" className="font-semibold text-velora-ink underline decoration-velora-ink/40 underline-offset-4 hover:decoration-velora-ink">{t("Join Intimo")}</Link></p>
        </div>
        <InvitationRequestForm />
      </section>
    </div>
  );
}
