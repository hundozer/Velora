"use client";

import Link from "next/link";
import { ArrowUpRight, HeartHandshake, Images, UsersRound } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

// Social V1 begins by making existing, permission-checked experiences discoverable.
// These are navigation links, never a new content or access-control layer.
const pathways = [
  { key: "connect", eyebrow: "01 / Connect", title: "Find your people", description: "Discover members, manage requests, and build mutual connections.", href: "/connections", action: "Your connections", Icon: HeartHandshake },
  { key: "belong", eyebrow: "02 / Belong", title: "Find your circle", description: "Join an existing conversation or start a member room.", href: "/rooms", action: "Explore rooms", Icon: UsersRound },
  { key: "express", eyebrow: "03 / Express", title: "Share on your terms", description: "Browse approved albums and choose what you want to share.", href: "/albums", action: "Explore albums", Icon: Images },
] as const;

export function SocialPathways() {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="social-pathways-heading" className="mb-7">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="social-pathways-heading" className="font-display text-2xl text-velora-ink sm:text-3xl">{t("Your Intimo")}</h2>
        <p className="text-xs text-velora-muted">{t("Connect · Belong · Express")}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {pathways.map(({ key, eyebrow, title, description, href, action, Icon }) => (
          <Link key={key} href={href} className="group flex min-w-0 flex-col rounded-2xl border border-velora-line bg-velora-paper p-4 text-velora-ink transition-colors hover:border-velora-copper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-velora-copper sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-velora-muted">{t(eyebrow)}</span>
              <Icon aria-hidden className="h-5 w-5 shrink-0 text-velora-copper" />
            </div>
            <h3 className="mt-3 font-display text-2xl leading-tight">{t(title)}</h3>
            <p className="mt-2 flex-1 text-[13px] leading-relaxed text-velora-ink2">{t(description)}</p>
            <span className="mt-4 inline-flex min-h-11 items-center gap-1 text-[13px] font-semibold text-velora-copperInk">{t(action)}<ArrowUpRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
          </Link>
        ))}
      </div>
    </section>
  );
}
