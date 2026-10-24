import React from "react";
import Link from "next/link";
import { CalendarDays, ExternalLink, MapPin } from "lucide-react";

export type SceneEvent = { id: string; title: string; kindLabel: string; startsAt: string; endsAt: string | null; venueName: string | null; areaId?: string | null; areaName: string | null; organiser: string; description: string | null; url: string; companyWindow?: { startsAt: string; endsAt: string } | null };

const dateFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Prague" });

/** One Prague Scene listing. Links out to the organiser; Intimo doesn't run events. */
export function SceneEventCard({ event }: { event: SceneEvent }) {
  return (
    <article className="space-y-2 rounded-3xl border border-ink/10 bg-velora-card/70 p-5">
      <div className="flex items-center justify-between gap-3 text-[11px]">
        <span className="rounded-full border border-velora-gold/40 bg-velora-gold/10 px-2.5 py-1 font-semibold uppercase tracking-wider text-velora-gold">{event.kindLabel}</span>
        <span className="inline-flex items-center gap-1 text-velora-textMuted"><CalendarDays className="h-3.5 w-3.5" aria-hidden />{dateFormat.format(new Date(event.startsAt))}</span>
      </div>
      <h3 className="font-display text-lg font-bold text-velora-textPrimary">{event.title}</h3>
      {event.description && <p className="text-sm leading-relaxed text-velora-textSecondary">{event.description}</p>}
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-velora-textMuted">
        <span>By {event.organiser}</span>
        {(event.venueName || event.areaName) && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />{[event.venueName, event.areaName].filter(Boolean).join(" · ")}</span>}
      </p>
      <a href={event.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex min-h-10 items-center gap-1.5 text-xs font-semibold text-velora-gold hover:underline">Details & tickets<ExternalLink className="h-3.5 w-3.5" aria-hidden /></a>
      {event.companyWindow && <div className="flex flex-wrap gap-3 border-t border-velora-line pt-3"><Link href={`/tonight/new?event=${encodeURIComponent(event.id)}`} className="inline-flex min-h-11 items-center rounded-full bg-velora-accent px-4 text-sm font-semibold text-velora-paper">Find company</Link><Link href={`/tonight?event=${encodeURIComponent(event.id)}`} className="inline-flex min-h-11 items-center text-sm text-velora-accent underline">Company invitations</Link><p className="w-full text-xs text-velora-muted">Nothing is shared until you publish an invitation. This is not an attendee list or a ticket.</p></div>}
    </article>
  );
}
