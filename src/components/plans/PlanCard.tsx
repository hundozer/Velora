"use client";

import React from "react";
import Link from "next/link";
import { Clock3, MapPin, MessageSquare, ShieldCheck } from "lucide-react";

export type Plan = {
  id: string; authorId: string; authorName: string; authorAvatar: string; authorAge: number | null; authorIsCouple: boolean; authorVerified: boolean;
  category: string; categoryLabel: string; title: string; text: string; areaName: string | null; distance: string | null;
  expiresAt: string; endsIn: string; replyTypes: string[]; minAge: number; maxAge: number; requireVerified: boolean; requireMedia: boolean;
  status: string; live: boolean; isMine: boolean;
};

const REPLY_LABELS: Record<string, string> = { "♀": "women", "♂": "men", "👫": "couples", "⚧": "trans & non-binary" };

function whoMayReply(plan: Plan) {
  const types = plan.replyTypes.length ? plan.replyTypes.map((value) => REPLY_LABELS[value] || value).join(", ") : "everyone";
  const ages = plan.minAge > 18 || plan.maxAge < 99 ? ` · ${plan.minAge}–${plan.maxAge}` : "";
  return `Open to ${types}${ages}${plan.requireVerified ? " · verified only" : ""}`;
}

/** One Tonight plan. Replying opens a conversation tagged with the plan; eligibility is checked server-side. */
export function PlanCard({ plan, onEnd, onReport }: { plan: Plan; onEnd?: (id: string) => void; onReport?: (plan: Plan) => void }) {
  return (
    <article className="space-y-3 rounded-3xl border border-white/10 bg-velora-card/70 p-5">
      <div className="flex items-center justify-between gap-3 text-[11px]">
        <span className="rounded-full border border-velora-gold/40 bg-velora-gold/10 px-2.5 py-1 font-semibold uppercase tracking-wider text-velora-gold">{plan.categoryLabel}</span>
        <span className="inline-flex items-center gap-1 text-velora-textMuted"><Clock3 className="h-3.5 w-3.5" aria-hidden />{plan.live ? plan.endsIn : "Ended"}</span>
      </div>
      <div>
        <h3 className="font-serif text-xl font-bold text-velora-textPrimary">{plan.title}</h3>
        <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-velora-textSecondary">{plan.text}</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-velora-textMuted">
        <Link href={`/profile/${plan.authorId}`} className="inline-flex items-center gap-2 font-semibold text-velora-textPrimary hover:text-velora-gold">
          <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-velora-bg">
            {plan.authorAvatar
              ? // eslint-disable-next-line @next/next/no-img-element
                <img src={plan.authorAvatar} alt="" className="h-full w-full object-cover" />
              : <span className="text-[11px] text-velora-gold">{plan.authorName.slice(0, 1).toUpperCase()}</span>}
          </span>
          {plan.authorName}{plan.authorAge ? `, ${plan.authorAge}` : ""}{plan.authorIsCouple ? " · couple" : ""}
        </Link>
        {plan.authorVerified && <span className="inline-flex items-center gap-1 text-emerald-300"><ShieldCheck className="h-3.5 w-3.5" aria-hidden />Verified</span>}
        {(plan.areaName || plan.distance) && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />{[plan.areaName, plan.distance].filter(Boolean).join(" · ")}</span>}
      </div>
      <p className="text-[11px] text-velora-textMuted">{whoMayReply(plan)}</p>
      <div className="flex flex-wrap gap-2">
        {plan.isMine ? (
          plan.live && onEnd && <button type="button" onClick={() => onEnd(plan.id)} className="min-h-10 rounded-full border border-white/15 px-4 text-xs font-semibold text-velora-textSecondary hover:border-red-400/50 hover:text-red-200">End plan now</button>
        ) : (
          <>
            <Link href={`/messages?user=${encodeURIComponent(plan.authorId)}&datingAd=${encodeURIComponent(plan.id)}`} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-gold-gradient px-5 text-xs font-bold text-velora-bg">
              <MessageSquare className="h-4 w-4" aria-hidden />Reply
            </Link>
            {onReport && <button type="button" onClick={() => onReport(plan)} className="min-h-10 rounded-full px-3 text-xs text-velora-textMuted hover:text-red-200">Report this plan</button>}
          </>
        )}
      </div>
    </article>
  );
}
