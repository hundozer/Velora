"use client";
import { useTranslation } from "@/context/LanguageContext";
import { Logo } from "@/components/brand/Logo";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isFlowPath } from "@/lib/flowRoutes";

const LINKS = [
  ["About", "/about"],
  ["Safety", "/safety"],
  ["Privacy", "/legal/privacy-policy"],
  ["Terms", "/legal/terms"],
  ["Cookies", "/legal/cookie-policy"],
  ["Moderation", "/legal/moderation"],
] as const;

export const Footer: React.FC = () => {
  const { t } = useTranslation();
  const pathname = usePathname();
  if (isFlowPath(pathname)) return null;
  return (
    <footer className="mt-10 w-full border-t border-velora-line">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-12 sm:px-8 md:flex-row md:items-end md:justify-between">
        <div>
          <Link href="/" aria-label={t("Intimo")} className="inline-block text-velora-ink"><Logo className="h-10 w-auto" /></Link>
          <p className="mt-3 max-w-sm text-base text-velora-ink2">{t("Kink, curiosity and consenting adults in Prague. Your yes. Your no. Strictly 18+.")}</p>
        </div>
        <nav aria-label={t("Footer")} className="flex flex-wrap gap-x-6 gap-y-3 text-base text-velora-ink2">
          {LINKS.map(([label, href]) => <Link key={href} href={href} className="hover:text-velora-ink">{t(label)}</Link>)}
        </nav>
      </div>
      <p className="mx-auto max-w-7xl px-5 pb-10 text-sm text-velora-muted sm:px-8">{t("© {getFullYear} Intimo", { getFullYear: new Date().getFullYear() })}</p>
    </footer>
  );
};
