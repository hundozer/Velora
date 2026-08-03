"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, MessageSquare, Users, Radio, User } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export const MobileNavigation: React.FC = () => {
  const pathname = usePathname();
  const { t } = useTranslation();

  const navItems = [
    { href: "/discovery", label: t("nav.discover"), icon: Compass },
    { href: "/messages", label: t("nav.messages"), icon: MessageSquare },
    { href: "/communities", label: t("nav.communities"), icon: Users },
    { href: "/live", label: t("nav.live"), icon: Radio },
    { href: "/dashboard", label: t("nav.feed"), icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-velora-bg/95 backdrop-blur-xl border-t border-white/10 px-2 py-2 flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
              isActive ? "text-velora-gold" : "text-velora-textMuted hover:text-white"
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? "text-velora-gold scale-110" : ""}`} />
            <span className="text-[10px] font-semibold tracking-wider">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
};
