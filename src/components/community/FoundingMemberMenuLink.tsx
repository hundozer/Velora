"use client";

import React from "react";
import Link from "next/link";
import { Crown } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export function FoundingMemberMenuLink({ mobile = false }: { mobile?: boolean }) {
  const { t } = useTranslation();
  const [eligible, setEligible] = React.useState(false);
  React.useEffect(() => {
    let live = true;
    fetch("/api/member/invitations", { credentials: "same-origin", cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(value => { if (live) setEligible(value?.eligible === true); })
      .catch(() => {});
    return () => { live = false; };
  }, []);
  if (!eligible) return null;
  return <Link href="/founding-member" className={mobile
    ? "flex min-h-14 items-center gap-3 px-4 py-3 font-semibold text-velora-gold hover:bg-ink/5"
    : "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-velora-gold hover:bg-ink/5"}>
    <Crown className="h-5 w-5" aria-hidden />{t("Founding Member")}
    {mobile && <span className="ml-auto text-velora-textMuted" aria-hidden>›</span>}
  </Link>;
}
