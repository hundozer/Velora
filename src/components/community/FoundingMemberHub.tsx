"use client";
import Link from "next/link";
import { Crown } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { FoundingMemberInvites } from "@/components/community/FoundingMemberInvites";

export function FoundingMemberHub() {
  const { t } = useTranslation();
  return <main className="mx-auto max-w-3xl space-y-6 px-4 py-9 sm:px-6">
    <div className="flex items-start gap-4">
      <Crown className="mt-1 h-8 w-8 text-velora-gold" aria-hidden />
      <div>
        <h1 className="text-3xl font-bold text-ink">{t("Founding Member")}</h1>
        <p className="mt-2 text-sm text-velora-textSecondary">{t("Thank you for helping build Intimo from the beginning.")}</p>
      </div>
    </div>
    <FoundingMemberInvites />
    <p className="text-sm text-velora-textMuted">{t("Your membership is recognition, not a moderator role. Every member can invite three people every three months.")}</p>
    <Link href="/me" className="inline-flex min-h-11 items-center text-sm font-semibold text-velora-gold">{t("Back to account")}</Link>
  </main>;
}
