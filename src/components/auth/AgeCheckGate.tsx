"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/LanguageContext";
import { VERIFIED, ageCheckOpenPath } from "@/lib/auth/ageCheck.mjs";

/**
 * FM-06: until their age check is approved, a member sees this instead of community pages.
 * The server refuses the data anyway; this only explains why and where to go.
 */
export function AgeCheckGate({ children }: { children: React.ReactNode }) {
  const { authState, ageCheckStatus, isStaff } = useAuth();
  const { t } = useTranslation();
  const pathname = usePathname();
  const gated = authState === "ACTIVE" && !isStaff && ageCheckStatus !== null && ageCheckStatus !== VERIFIED && !ageCheckOpenPath(pathname);
  if (!gated) return <>{children}</>;
  const pending = ageCheckStatus === "PENDING";
  return (
    <section className="mx-auto max-w-xl space-y-4 px-4 py-16 text-center">
      <ShieldCheck className="mx-auto h-10 w-10 text-velora-accent" aria-hidden />
      <h1 className="font-display text-4xl font-bold leading-tight text-velora-textPrimary">{pending ? t("Your age check is being reviewed") : t("One last step before you're in")}</h1>
      <p className="text-sm leading-relaxed text-velora-textSecondary">{pending ? t("A person at Intimo is looking at your selfie. You'll see everything as soon as it's approved. Meanwhile, finish your profile.") : t("Intimo is only for adults, so a person on our team checks every new member with a quick selfie. Until then, only you can see your profile.")}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/verify-age" className="inline-flex min-h-11 items-center rounded-full bg-velora-accent px-6 text-sm font-bold text-velora-paper">{pending ? t("See my age check") : t("Start my age check")}</Link>
        <Link href="/me" className="inline-flex min-h-11 items-center rounded-full border border-ink/15 px-6 text-sm font-semibold text-velora-textPrimary">{t("Finish my profile")}</Link>
      </div>
    </section>
  );
}
