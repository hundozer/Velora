"use client";

import React from "react";
import Link from "next/link";
import { SceneEventCard, type SceneEvent } from "@/components/scene/SceneEventCard";

/** Home section for Prague Scene (P1-21). Hidden entirely when nothing is listed. */
export function ScenePreview() {
  const [events, setEvents] = React.useState<SceneEvent[]>([]);
  React.useEffect(() => {
    fetch("/api/scene?limit=3").then((response) => (response.ok ? response.json() : null)).then((payload) => setEvents(payload?.events || [])).catch(() => undefined);
  }, []);
  if (events.length === 0) return null;
  return (
    <section aria-labelledby="scene-preview" className="space-y-4">
      <div className="flex items-end justify-between gap-4"><h2 id="scene-preview" className="text-xl font-bold text-ink">Prague Scene</h2><Link href="/scene" className="text-sm font-semibold text-velora-accent hover:text-velora-accent">All events</Link></div>
      <div className="grid gap-4 md:grid-cols-3">{events.map((event) => <SceneEventCard key={event.id} event={event} />)}</div>
    </section>
  );
}
