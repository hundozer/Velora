"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { isFlowPath } from "@/lib/flowRoutes";
import { useNavTone } from "@/lib/ui/navTone";

/**
 * Bottom navigation as words (approved v33): People · Tonight · Messages · You,
 * the current one marked with a copper dot. Dark variant over dark openings.
 */
export const MobileNavigation: React.FC = () => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { user } = useAuth();
  const tone = useNavTone();

  const items = user
    ? [
        { href: "/people", label: t("nav.people") },
        { href: "/personal-ads", label: "Dating" },
        { href: "/tonight", label: t("nav.tonight") },
        { href: "/messages", label: t("nav.messages") },
        { href: "/me", label: t("nav.me") },
      ]
    : [
        { href: "/", label: t("nav.home") },
        { href: "/people", label: t("nav.people") },
        { href: "/tonight", label: t("nav.tonight") },
      ];
  if (isFlowPath(pathname)) return null;
  const dark = tone === "dark";

  return (
    <nav aria-label="Mobile navigation" className={`md:hidden fixed bottom-0 left-0 right-0 z-50 border-t pb-[env(safe-area-inset-bottom)] transition-colors duration-300 ${dark ? "border-white/10 bg-velora-night" : "border-velora-line bg-velora-paper"}`}>
      <div className="flex h-16 items-stretch justify-around px-2">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`) || (item.href === "/people" && pathname.startsWith("/profile/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-w-[54px] flex-col items-center justify-center text-[14px] transition-colors ${active ? (dark ? "font-semibold text-velora-onPhoto" : "font-semibold text-velora-ink") : dark ? "text-velora-onPhoto/70 hover:text-velora-onPhoto" : "text-velora-muted hover:text-velora-ink"}`}
            >
              {item.label}
              <span aria-hidden className={`mt-1.5 h-1 w-1 rounded-full ${active ? "bg-velora-copper" : "bg-transparent"}`} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
