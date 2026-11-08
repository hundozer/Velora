"use client";

import { Crown } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

/** Community recognition, never identity verification or staff authority. */
export function FoundingMemberBadge({ compact = false, onPhoto = false }: { compact?: boolean; onPhoto?: boolean }) {
  const { t } = useTranslation();
  return (
    <span aria-label={t("Founding Member")} title={t("Founding Member")}
      className={`inline-flex max-w-full shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none tracking-wide ${onPhoto ? "border-velora-onPhoto/30 bg-velora-night/75 text-velora-onPhoto" : "border-velora-copper/35 bg-velora-copper/10 text-velora-copperInk"}`}>
      <Crown className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {!compact && <span>{t("Founding Member")}</span>}
    </span>
  );
}
