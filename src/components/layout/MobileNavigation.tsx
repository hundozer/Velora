"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, MessageSquare, Users, Flame, CircleUserRound } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { isFlowPath } from "@/lib/flowRoutes";

export const MobileNavigation: React.FC = () => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { user } = useAuth();

  const publicItems = [
    { href: "/", label: t("nav.home"), icon: Compass },
    { href: "/people", label: t("nav.people"), icon: Users },
    { href: "/tonight", label: t("nav.tonight"), icon: Flame },
  ];
  const memberItems = [
    { href: "/messages", label: t("nav.messages"), icon: MessageSquare },
    { href: "/me", label: t("nav.me"), icon: CircleUserRound },
  ];
  const navItems = user ? [...publicItems, ...memberItems] : publicItems;
  if (isFlowPath(pathname)) return null;

  return (
    <nav aria-label="Mobile navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-velora-paper border-t border-velora-line pb-[env(safe-area-inset-bottom)] px-2 py-2 flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
              isActive ? "text-velora-gold" : "text-velora-textMuted hover:text-ink"
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? "text-velora-gold scale-110" : ""}`} />
            <span className="text-[10px] font-semibold tracking-wider">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
