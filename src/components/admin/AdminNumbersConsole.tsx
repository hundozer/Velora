"use client";
import React from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { metricsSummary, type FounderMetrics } from "@/lib/admin/founderMetrics.mjs";

function Stat({ label, value, detail }: { label: string; value: React.ReactNode; detail?: string }) {
  return <section className="rounded-xl border border-velora-line bg-velora-surface p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-velora-muted">{label}</p>
    <p className="mt-2 text-3xl font-bold text-velora-ink">{value}</p>
    {detail && <p className="mt-1 text-xs text-velora-ink2">{detail}</p>}
  </section>;
}

const percent = (value: number | null) => (value === null ? "–" : `${value}%`);

function MixBar({ rows }: { rows: Array<[string, number, number | null]> }) {
  const total = rows.reduce((sum, [, count]) => sum + count, 0);
  const shades = ["bg-velora-accent", "bg-velora-ink2", "bg-velora-accent/60", "bg-velora-muted", "bg-velora-line"];
  return <div>
    <div className="flex h-3 overflow-hidden rounded-full bg-velora-sunken" aria-hidden>
      {total > 0 && rows.map(([label, count], index) => count > 0 && <span key={label} className={shades[index]} style={{ width: `${(count / total) * 100}%` }} />)}
    </div>
    <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
      {rows.map(([label, count, pct], index) => <li key={label} className="flex items-center gap-2"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${shades[index]}`} aria-hidden /><span className="text-velora-ink2">{label}</span><span className="ml-auto font-semibold tabular-nums">{count}{pct !== null && <span className="ml-1 font-normal text-velora-muted">({pct}%)</span>}</span></li>)}
    </ul>
  </div>;
}

/** FM-04: the founding numbers, aggregate only, for the weekly update. */
export function AdminNumbersConsole() {
  const [metrics, setMetrics] = React.useState<FounderMetrics | null>(null);
  const [truncated, setTruncated] = React.useState(false);
  const [error, setError] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const load = React.useCallback(async () => {
    setError("");
    const response = await fetch("/api/admin/metrics", { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return setError(payload.error || "Numbers unavailable");
    setMetrics(payload.metrics); setTruncated(Boolean(payload.truncated));
  }, []);
  React.useEffect(() => { void load(); }, [load]);
  async function copy() {
    if (!metrics) return;
    await navigator.clipboard.writeText(metricsSummary(metrics));
    setCopied(true); window.setTimeout(() => setCopied(false), 2000);
  }

  if (error) return <p role="alert" className="text-velora-danger">{error}</p>;
  if (!metrics) return <p>Loading numbers…</p>;
  const m = metrics;
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="max-w-3xl text-sm text-velora-ink2">Totals only, for the weekly founder update. Never shown to members or on the public site. With so few members, treat percentages as direction, not proof.</p>
      <div className="flex gap-2">
        <button type="button" onClick={() => void load()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-velora-control px-4 text-sm font-semibold"><RefreshCw className="h-4 w-4" aria-hidden />Refresh</button>
        <button type="button" onClick={() => void copy()} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-velora-accent px-4 text-sm font-bold text-velora-paper">{copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}{copied ? "Copied" : "Copy summary"}</button>
      </div>
    </div>
    {truncated && <p role="status" className="rounded-lg border border-velora-warning/40 bg-velora-warning/10 p-3 text-sm">Over 10,000 rows in one table: these numbers are incomplete. Move this page to SQL aggregates before relying on it.</p>}

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Stat label="Members" value={m.members.total} detail={`${m.members.newLast7Days} new in the last 7 days`} />
      <Stat label="Active this week" value={m.members.activeLast7Days} detail="Opened Intimo in the last 7 days" />
      <Stat label="Verified" value={m.members.verified} detail={`${percent(m.members.verifiedPct)} of members`} />
      <Stat label="Reports per 100 members" value={m.reports.per100Members ?? "–"} detail={`${m.reports.last30Days} reports in the last 30 days`} />
    </div>

    <div className="grid gap-3 lg:grid-cols-2">
      <section className="rounded-xl border border-velora-line bg-velora-surface p-5">
        <h2 className="font-bold">Who's in</h2>
        <p className="mb-4 mt-1 text-xs text-velora-muted">Active members, from what they chose at onboarding.</p>
        <MixBar rows={[["Women", m.mix.women.count, m.mix.women.pct], ["Men", m.mix.men.count, m.mix.men.pct], ["Couples", m.mix.couples.count, m.mix.couples.pct], ["Non-binary or other", m.mix.nonBinaryOrOther.count, m.mix.nonBinaryOrOther.pct], ["Not stated", m.mix.notStated.count, m.mix.notStated.pct]]} />
        <p className="mt-4 text-xs text-velora-muted">{m.members.foundingMembers} Founding Members.</p>
      </section>
      <section className="rounded-xl border border-velora-line bg-velora-surface p-5">
        <h2 className="font-bold">Who's asking to join</h2>
        <p className="mb-4 mt-1 text-xs text-velora-muted">All invitation requests from the front page.</p>
        <MixBar rows={[["Women", m.invitationRequests.mix.women, null], ["Men", m.invitationRequests.mix.men, null], ["Couples", m.invitationRequests.mix.couples, null], ["Non-binary or other", m.invitationRequests.mix.nonBinaryOrOther, null]]} />
        <p className="mt-4 text-xs text-velora-muted">{m.invitationRequests.total} requests: {m.invitationRequests.pending} waiting, {m.invitationRequests.approved} approved, {m.invitationRequests.rejected} rejected.</p>
      </section>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Stat label="Invitations sent" value={m.invitations.sent} detail="Accepted by the email provider" />
      <Stat label="Joined" value={m.invitations.joined} detail={`${percent(m.invitations.acceptancePct)} of invitations sent`} />
      <Stat label="Waiting" value={m.invitations.waiting} detail="Sent, not used, still valid" />
      <Stat label="Expired" value={m.invitations.expired} detail="Not used within 30 days" />
    </div>

    <section className="rounded-xl border border-velora-line bg-velora-surface p-5">
      <h2 className="font-bold">Week by week</h2>
      <p className="mt-1 text-xs text-velora-muted">Weeks start on Monday (UTC). The last row is the current week so far.</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-velora-muted"><tr><th className="py-2 pr-4 font-semibold">Week of</th><th className="py-2 pr-4 text-right font-semibold">New members</th><th className="py-2 pr-4 text-right font-semibold">Requests</th><th className="py-2 pr-4 text-right font-semibold">Invites sent</th><th className="py-2 pr-4 text-right font-semibold">Joined</th><th className="py-2 text-right font-semibold">Reports</th></tr></thead>
          <tbody className="divide-y divide-velora-line tabular-nums">
            {m.weekly.map((week) => <tr key={week.weekStart}><td className="py-2 pr-4">{new Date(`${week.weekStart}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}</td><td className="py-2 pr-4 text-right">{week.newMembers}</td><td className="py-2 pr-4 text-right">{week.invitationRequests}</td><td className="py-2 pr-4 text-right">{week.invitationsSent}</td><td className="py-2 pr-4 text-right">{week.invitationsAccepted}</td><td className="py-2 text-right">{week.reports}</td></tr>)}
          </tbody>
        </table>
      </div>
    </section>
    <p className="text-xs text-velora-muted">Updated {new Date(m.generatedAt).toLocaleString("en-GB")}. Demo, deleted and restricted accounts are not counted as members.</p>
  </div>;
}
