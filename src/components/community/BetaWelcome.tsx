"use client";

import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";

const TASKS = [
  { title: "Check your age", copy: "Try the selfie check and tell us if anything feels confusing.", href: "/verify-age" },
  { title: "Make your profile yours", copy: "Add a few words about yourself. A face photo is optional.", href: "/me" },
  { title: "Choose what you share", copy: "Look at your consents and privacy settings.", href: "/settings" },
  { title: "Start a conversation", copy: "Explore people and try sending a message when you feel ready.", href: "/people" },
] as const;

export function BetaWelcome() {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="beta-welcome" className="space-y-4 rounded-3xl border border-velora-line bg-velora-surface p-6 sm:p-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.20em] text-velora-accent">{t("A little help from our first members")}</p>
        <h2 id="beta-welcome" className="font-display text-3xl font-normal text-velora-ink sm:text-4xl">{t("Make yourself at home. Then tell us what feels off.")}</h2>
        <p className="max-w-2xl text-sm leading-6 text-velora-textSecondary">{t("We're testing Intimo with a small group. Try these four things when you have a moment. There are no perfect answers.")}</p>
      </div>
      <ol className="grid gap-3 sm:grid-cols-2">
        {TASKS.map((task, index) => (
          <li key={task.href} className="rounded-2xl border border-velora-line p-4">
            <Link href={task.href} className="flex items-start gap-3 group">
              <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-velora-accent/50 text-xs font-semibold text-velora-accent">{index + 1}</span>
              <span className="space-y-1">
                <span className="block text-sm font-semibold text-velora-ink group-hover:underline">{t(task.title)}</span>
                <span className="block text-xs leading-5 text-velora-textMuted">{t(task.copy)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <div className="border-t border-velora-line pt-4">
        <p className="text-sm text-velora-textSecondary">{t("Something confusing, broken or unexpectedly good? Tell us. One message is enough.")}</p>
        <a href="mailto:contact@intimo.live?subject=Intimo%20beta%20feedback" className="mt-3 inline-flex min-h-11 items-center rounded-full border border-velora-ink/30 px-5 text-sm font-semibold text-velora-ink hover:border-velora-accent">{t("Send beta feedback")}</a>
      </div>
    </section>
  );
}
