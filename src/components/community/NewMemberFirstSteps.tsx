"use client";

import React from "react";
import Link from "next/link";
import { Check, Compass, MessageCircle, UserRound } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

type Progress = {
  profileId: string;
  newMember: boolean;
  hasPhoto: boolean;
  hasPreferences: boolean;
  firstContactMade: boolean;
};

/** A small, useful first-week orientation. Completion comes only from actual account data. */
export function NewMemberFirstSteps() {
  const { t } = useTranslation();
  const [data, setData] = React.useState<Progress | null>(null);
  React.useEffect(() => {
    const controller = new AbortController();
    fetch("/api/member/activation", { cache: "no-store", credentials: "same-origin", signal: controller.signal })
      .then(async response => response.ok ? response.json() : null)
      .then(payload => { if (!controller.signal.aborted && payload) setData(payload); })
      .catch(() => { /* No speculative progress when account data is unavailable */ });
    return () => controller.abort();
  }, []);
  if (!data?.newMember || (data.hasPhoto && data.hasPreferences && data.firstContactMade)) return null;

  const steps = [
    { done: data.hasPhoto, label: t("Add your profile photo"), href: `/profile/${data.profileId}?tab=PHOTOS`, icon: UserRound },
    { done: data.hasPreferences, label: t("Tell people what you're looking for"), href: `/profile/${data.profileId}`, icon: Compass },
    { done: data.firstContactMade, label: t("Start your first conversation"), href: "/people", icon: MessageCircle },
  ];
  return <section aria-labelledby="first-steps-heading" className="mb-7 rounded-2xl border border-velora-accent/30 bg-velora-card p-5 sm:p-6">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-velora-accent">{t("Your first steps")}</p>
    <h2 id="first-steps-heading" className="mt-2 font-display text-2xl font-semibold text-ink">{t("Make yourself at home.")}</h2>
    <p className="mt-2 text-sm leading-6 text-velora-textSecondary">{t("A few small steps make it easier for real people to find and connect with you.")}</p>
    <div className="mt-4 grid gap-2 sm:grid-cols-3">
      {steps.map(({ done, label, href, icon: Icon }) => (
        <Link key={label} href={href} className="flex min-h-16 items-center gap-3 rounded-xl border border-ink/10 px-4 py-3 transition hover:border-velora-accent/40">
          <span aria-hidden className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${done ? "bg-velora-success/15 text-velora-success" : "bg-velora-accent/10 text-velora-accent"}`}>
            {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
          </span>
          <span className="text-sm font-semibold text-ink">{label}</span>
        </Link>
      ))}
    </div>
  </section>;
}
