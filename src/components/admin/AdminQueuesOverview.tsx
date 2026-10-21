"use client";

import React from "react";
import Link from "next/link";

type Queue = { id: string; label: string; targetHours: number; href: string; count: number | null; oldestHours: number | null };

/** Review queues against their targets (P1-18). */
export function AdminQueuesOverview() {
  const [queues, setQueues] = React.useState<Queue[] | null>(null);
  const [error, setError] = React.useState("");
  React.useEffect(() => {
    fetch("/api/admin/queues", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => { const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload.error || "Queues unavailable"); setQueues(payload.queues || []); })
      .catch((cause) => setError(cause.message));
  }, []);
  if (error) return <p role="alert" className="text-sm text-velora-danger">{error}</p>;
  if (!queues) return <p className="text-sm text-velora-ink2">Loading…</p>;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {queues.map((queue) => {
        const late = queue.oldestHours !== null && queue.oldestHours > queue.targetHours;
        return (
          <Link key={queue.id} href={queue.href} className={`rounded-xl border border-velora-line bg-velora-surface p-4 hover:border-velora-control ${late ? "border-velora-danger/40" : ""}`}>
            <p className="text-sm font-semibold">{queue.label}</p>
            <p className="mt-1 text-2xl font-bold">{queue.count ?? "—"}</p>
            <p className={`text-xs ${late ? "font-bold text-velora-danger" : "text-velora-muted"}`}>
              {queue.oldestHours === null ? "Nothing waiting" : `Oldest waiting ${queue.oldestHours} h · target ${queue.targetHours} h`}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
