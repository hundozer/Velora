"use client";

import { useTranslation } from "@/context/LanguageContext";
import React from "react";
import Link from "next/link";
import { HandUnderline } from "@/components/brand/HandDrawn";

/** After account deletion. Brand: flat print look, serif voice, no promises (docs/brand/BRAND.md). */
export default function GoodbyePage() {
  const { t } = useTranslation();
  return (
    <div className="intimo-grain flex min-h-[80vh] items-center justify-center px-5 py-16">
      <div className="w-full max-w-lg">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-velora-muted">{t("We have your deletion request.")}</p>
        <h1 className="mt-5 font-serif text-[clamp(2.75rem,8vw,4rem)] leading-[0.95] text-velora-ink">{t("Sorry to see you go.")}</h1>
        <HandUnderline className="mt-3 w-[200px]" />
        <p className="mt-6 text-[17px] leading-relaxed text-velora-ink2">{t("Thank you for being here. Whatever you found, we hope it was worth it.")}</p>

        <ul className="mt-8 space-y-4 border-t border-velora-line pt-6 text-sm leading-relaxed text-velora-muted">
          <li>{t("Your login has been removed and your profile deactivated. Profile data, messages, and media follow the documented deletion/anonymization workflow and any legitimate safety or legal retention duties.")}</li>
          <li>{t("Permanent erasure is not immediate. Deactivated accounts become eligible for the deletion/anonymization workflow after 30 days, subject to applicable retention duties.")}</li>
        </ul>

        <p className="mt-8 text-sm text-velora-ink2">{t("Want to come back one day? Ask a member to send you a new invitation.")}</p>
        <Link href="/" className="mt-5 inline-flex min-h-12 items-center rounded-full border border-velora-ink/30 px-6 text-sm font-semibold text-velora-ink transition hover:border-velora-ink">{t("Back to the front page")}</Link>
      </div>
    </div>
  );
}
