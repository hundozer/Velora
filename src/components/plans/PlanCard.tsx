"use client";

import { useTranslation } from "@/context/LanguageContext";
import React from "react";
import Link from "next/link";
import { clock, glanceTime } from "@/lib/tonight.mjs";

export type Plan = {
  id: string; authorId: string; authorName: string; authorAvatar: string; authorAge: number | null; authorIsCouple: boolean; authorVerified: boolean;
  category: string; categoryLabel: string; title: string; text: string; areaName: string | null; distance: string | null;
  startsAt: string; expiresAt: string; endsIn: string; replyTypes: string[]; minAge: number; maxAge: number; requireVerified: boolean; requireMedia: boolean;
  status: string; live: boolean; isMine: boolean;
  /** Who may reply, in words, and whether this viewer can — computed by the server's reply rule. */
  audience?: string; canReply?: boolean; replyReason?: string | null; eligibilityText?: string | null;
  sceneEventId?: string | null;
};

export const replyHref = (plan: Plan) => `/messages?user=${encodeURIComponent(plan.authorId)}&datingAd=${encodeURIComponent(plan.id)}`;
export const sharePlanHref = (plan: Plan) => `/stories/new?plan=${encodeURIComponent(plan.id)}`;
export function PlanEventLink({ plan }: { plan: Plan }) {
  const { t } = useTranslation();
  return plan.sceneEventId ? <Link href={`/scene?event=${encodeURIComponent(plan.sceneEventId)}`} className="mt-2 inline-flex min-h-11 items-center text-sm text-velora-accent underline">{t("View linked event")}</Link> : null;
}

/**
 * One plan as an editorial entry (used on profiles): when, what, who, whether you can
 * reply. Replying opens a conversation tagged with the plan; the server re-checks eligibility.
 */
export function PlanCard({ plan, onEnd, onReport, showTitle = true }: { showTitle?: boolean; plan: Plan; onEnd?: (id: string) => void; onReport?: (plan: Plan) => void }) {
  const { t, locale } = useTranslation();
  return (
    <article className="border-t border-velora-line py-5">
      <p className="font-display text-[26px] leading-none text-velora-copperInk">
        {glanceTime(plan, undefined, t, locale)}<span className="ml-2 font-sans text-[14px] text-velora-muted">{t("until {clock}", { clock: clock(plan.expiresAt) })}{plan.areaName ? ` · ${plan.areaName}` : ""}</span>
      </p>
      {showTitle && <h3 className="mt-2 font-display text-[24px] leading-tight text-velora-ink"><Link href={`/tonight/invitation/${plan.id}`} className="hover:underline">{t(plan.title)}</Link></h3>}
      <PlanEventLink plan={plan}/>
      {plan.text && <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-velora-ink2">{t(plan.text)}</p>}
      {plan.eligibilityText && <p className="mt-2 text-[14px] text-velora-ink2">{plan.canReply ? "✓ " : ""}{t(plan.eligibilityText)}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
        {plan.isMine ? (
          <>{plan.live && <Link href={sharePlanHref(plan)} className="inline-flex min-h-11 items-center text-velora-accent underline">{t("Share to your Story")}</Link>}{plan.live && onEnd && <button type="button" onClick={() => onEnd(plan.id)} className="min-h-11 text-[15px] text-velora-ink underline underline-offset-4">{t("End it now")}</button>}</>
        ) : (
          <>
            {plan.canReply !== false && <Link href={replyHref(plan)} className="inline-flex min-h-11 items-center rounded-full bg-velora-accent px-5 text-[15px] font-semibold text-velora-paper">{t("Reply to {authorName}", { authorName: plan.authorName })}</Link>}
            {onReport && <button type="button" onClick={() => onReport(plan)} className="min-h-11 text-[14px] text-velora-muted underline underline-offset-4">{t("Report this plan")}</button>}
          </>
        )}
      </div>
    </article>
  );
}
