"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { isFlowPath } from "@/lib/flowRoutes";
import { useNavTone } from "@/lib/ui/navTone";
import { useUnreadCounts } from "@/lib/notifications/useUnreadCounts";

/**
 * Bottom navigation as words (approved v33): People · Tonight · Messages · You,
 * the current one marked with a copper dot. Dark variant over dark openings.
 * Something new on Messages or You shows as a small copper dot beside the word
 * (never a public number); tapping the current tab scrolls back to the top.
 */
export const MobileNavigation: React.FC = () => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const tone = useNavTone();
  const unread = useUnreadCounts(user ? profile?.id : undefined, pathname);

  const items = user
    ? [
        { href: "/people", label: t("nav.people") },
        { href: "/personal-ads", label: "Dating" },
        { href: "/tonight", label: t("nav.tonight") },
        { href: "/messages", label: t("nav.messages"), unread: unread.messages },
        { href: "/me", label: t("nav.me"), unread: unread.notifications },
      ] as { href: string; label: string; unread?: number }[]
    : [
        { href: "/", label: t("nav.home") },
        { href: "/people", label: t("nav.people") },
        { href: "/tonight", label: t("nav.tonight") },
      ] as { href: string; label: string; unread?: number }[];
  if (isFlowPath(pathname)) return null;
  const dark = tone === "dark";

  return (
    <nav aria-label={t("Mobile navigation")} className={`md:hidden fixed bottom-0 left-0 right-0 z-50 border-t pb-[env(safe-area-inset-bottom)] transition-colors duration-300 ${dark ? "border-white/10 bg-velora-night" : "border-velora-line bg-velora-paper"}`}>
      <div className="flex h-16 items-stretch justify-around px-2">
        {items.map((item) => {
          const fresh = (item.unread || 0) > 0;
          const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`) || (item.href === "/people" && pathname.startsWith("/profile/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              onClick={() => { if (active && pathname === item.href) window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className={`relative flex min-w-[54px] flex-col items-center justify-center text-[14px] transition-colors ${active ? (dark ? "font-semibold text-velora-onPhoto" : "font-semibold text-velora-ink") : dark ? "text-velora-onPhoto/70 hover:text-velora-onPhoto" : "text-velora-muted hover:text-velora-ink"}`}
            >
              <span className="relative">
                {t(item.label)}
                {fresh && <span aria-hidden data-unread className="absolute -right-2.5 top-0 h-1.5 w-1.5 rounded-full bg-velora-copper" />}
              </span>
              {fresh && <span className="sr-only">{item.href === "/messages" ? t("New messages") : t("New notifications")}</span>}
              <span aria-hidden className={`mt-1.5 h-1 w-1 rounded-full ${active ? "bg-velora-copper" : "bg-transparent"}`} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
