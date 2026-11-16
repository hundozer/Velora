"use client";
import Link from "next/link";
import { ArrowDown, KeyRound, LockKeyhole, MessageCircleHeart } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { Logo } from "@/components/brand/Logo";
import { InvitationRequestForm } from "@/components/community/InvitationRequestForm";

// Only what the product does today (docs/brand/BRAND.md: never promise more).
const PROMISES = [
  { icon: KeyRound, title: "Invitation only", body: "Every member is invited or personally approved. No open sign-up, no strangers browsing." },
  { icon: LockKeyhole, title: "Private by design", body: "Private albums open only when you say yes, and you can take access back at any time." },
  { icon: MessageCircleHeart, title: "Your boundaries, respected", body: "Say what you're into and what's off limits, and choose who can write to you." },
] as const;

/**
 * Front page while Coming Soon is on (src/lib/comingSoon.mjs): what Intimo is,
 * the invitation request form, and a way in for members. No photos, no counts.
 */
export function ComingSoonHome() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-6xl px-5 sm:px-8">
      <section className="flex min-h-[calc(100svh-9rem)] flex-col items-center justify-center py-16 text-center sm:py-24" aria-labelledby="coming-soon-title">
        <div aria-hidden><Logo variant="symbol" className="h-24 w-auto text-velora-ink sm:h-32" /></div>
        <p className="mt-10 text-xs font-semibold uppercase tracking-[0.22em] text-velora-muted">{t("Prague · Invitation only · 18+")}</p>
        <h1 id="coming-soon-title" className="mt-5 font-display text-[clamp(3.5rem,11vw,8.5rem)] font-extrabold leading-[0.95] tracking-[-0.04em]">{t("Coming soon.")}</h1>
        <p className="mt-6 text-xl font-semibold tracking-tight text-velora-ink sm:text-2xl">{t("Boundaries first. Then chemistry.")}</p>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-velora-ink2 sm:text-lg">{t("A private, invitation-only community for adults in Prague who know what they like, or want to find out.")}</p>
        <div className="mt-10 flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
          <a href="#request-invitation" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-velora-accent px-7 text-base font-bold text-velora-paper transition hover:bg-velora-accentHover">{t("Request an invitation")}<ArrowDown className="h-5 w-5" aria-hidden /></a>
          <p className="text-sm text-velora-ink2">{t("Already a member?")}{" "}<a href="/auth/login" className="font-semibold text-velora-ink underline decoration-velora-ink/40 underline-offset-4 hover:decoration-velora-ink">{t("Log in")}</a></p>
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
          <h2 id="request-title" className="font-display text-[clamp(2.5rem,5vw,4rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">{t("Ask for an invitation.")}</h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-velora-ink">{t("We're opening the doors to our first 100 members, chosen by hand.")}</p>
          <p className="mt-4 max-w-md text-base leading-relaxed text-velora-ink2">{t("Tell us a little about yourself. We read every request personally, and if it's a good fit, your invitation arrives by email.")}</p>
          <p className="mt-8 text-sm text-velora-ink2">{t("Have an invitation?")}{" "}<Link href="/register" className="font-semibold text-velora-ink underline decoration-velora-ink/40 underline-offset-4 hover:decoration-velora-ink">{t("Join Intimo")}</Link></p>
        </div>
        <InvitationRequestForm />
      </section>
    </div>
  );
}
