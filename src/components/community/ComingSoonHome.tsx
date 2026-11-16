"use client";
import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";
import { Logo } from "@/components/brand/Logo";
import { LanguageSwitch } from "@/components/i18n/LanguageSwitch";
import { InvitationRequestForm } from "@/components/community/InvitationRequestForm";

/**
 * Front page while Coming Soon is on (src/lib/comingSoon.mjs): what Intimo is,
 * the invitation request form, and a way in for members. No photos, no counts.
 */
export function ComingSoonHome() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <section aria-label="Jazyk / Language" className="mx-auto max-w-xl pt-8 sm:pt-10">
        <p className="mb-3 text-center text-[13px] font-semibold uppercase tracking-[0.18em] text-velora-muted">Vyber jazyk · Choose your language</p>
        <LanguageSwitch variant="hero" />
      </section>

      <section className="grid gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14" aria-labelledby="coming-soon-title">
        <div>
          <div aria-hidden><Logo variant="symbol" className="h-14 w-auto text-velora-ink" /></div>
          <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-velora-accent">{t("Prague · Sex-positive · 18+")}</p>
          <h1 id="coming-soon-title" className="mt-4 font-display text-[clamp(3rem,6.5vw,5.5rem)] leading-[1.02] tracking-tight">{t("Coming soon.")}</h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-velora-ink">{t("A private, invitation-only community for adults in Prague who know what they like, or want to find out.")}</p>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-velora-ink2">{t("We're opening the doors to our first 100 members, chosen by hand. Ask for an invitation and tell us a little about yourself. We read every request personally.")}</p>
          <div className="mt-8 space-y-2 text-sm text-velora-ink2">
            <p>{t("Already a member?")}{" "}<a href="/auth/login" className="font-semibold text-velora-accent underline decoration-velora-accent/50 underline-offset-4 hover:decoration-velora-accent">{t("Log in")}</a></p>
            <p>{t("Have an invitation?")}{" "}<Link href="/register" className="font-semibold text-velora-accent underline decoration-velora-accent/50 underline-offset-4 hover:decoration-velora-accent">{t("Join Intimo")}</Link></p>
          </div>
        </div>
        <div id="request-invitation" className="scroll-mt-24">
          <InvitationRequestForm />
        </div>
      </section>
    </div>
  );
}
