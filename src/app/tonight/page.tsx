"use client";

import React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { BehindTheDoorLanding } from "@/components/landing/BehindTheDoorLanding";
import { ReportModal } from "@/components/safety/ReportModal";
import { PlanCard, type Plan } from "@/components/plans/PlanCard";
import { PLAN_CATEGORIES } from "@/lib/plans.mjs";

/** Tonight (P1-07): live, time-boxed Plans from members in and around Prague. */
export default function TonightPage() {
  const { user } = useAuth();
  const [plans, setPlans] = React.useState<Plan[] | null>(null);
  const [mine, setMine] = React.useState<Plan[]>([]);
  const [category, setCategory] = React.useState("");
  const [error, setError] = React.useState("");
  const [reporting, setReporting] = React.useState<Plan | null>(null);

  const load = React.useCallback(async () => {
    setError("");
    const query = category ? `?category=${encodeURIComponent(category)}` : "";
    const [allResponse, mineResponse] = await Promise.all([
      fetch(`/api/dating-ads${query}`, { credentials: "same-origin", cache: "no-store" }),
      fetch("/api/dating-ads?mine=true", { credentials: "same-origin", cache: "no-store" }),
    ]);
    const all = await allResponse.json().catch(() => ({}));
    const own = await mineResponse.json().catch(() => ({}));
    if (!allResponse.ok) { setError(all.error || "Plans could not be loaded."); setPlans([]); return; }
    setPlans((all.plans || []).filter((plan: Plan) => !plan.isMine));
    setMine((own.plans || []).filter((plan: Plan) => plan.live));
  }, [category]);

  React.useEffect(() => { if (user) void load(); }, [user, load]);

  async function endPlan(id: string) {
    if (!window.confirm("End this plan now? It disappears for everyone.")) return;
    const response = await fetch(`/api/dating-ads/${encodeURIComponent(id)}`, { method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "END" }) });
    if (response.ok) void load();
  }

  if (!user) return <BehindTheDoorLanding />;

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 pb-24 pt-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-velora-gold">Tonight</p>
          <h1 className="font-serif text-3xl font-bold text-velora-textPrimary">What&apos;s happening</h1>
          <p className="mt-1 text-sm text-velora-textSecondary">Plans from members nearby. They disappear when they expire.</p>
        </div>
        <Link href="/tonight/new" className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-gold-gradient px-5 text-sm font-bold text-velora-bg"><Plus className="h-4 w-4" aria-hidden />Post a plan</Link>
      </header>

      {mine.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-velora-textSecondary">Your plans</h2>
          {mine.map((plan) => <PlanCard key={plan.id} plan={plan} onEnd={endPlan} />)}
        </section>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Plan categories">
        {[{ value: "", label: "All" }, ...PLAN_CATEGORIES].map((item) => (
          <button key={item.value || "all"} type="button" role="tab" aria-selected={category === item.value} onClick={() => setCategory(item.value)} className={`min-h-9 shrink-0 rounded-full border px-3 text-xs transition ${category === item.value ? "border-velora-gold bg-velora-gold/15 text-velora-textPrimary" : "border-white/10 text-velora-textSecondary hover:border-white/25"}`}>
            {item.label}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">{error}</p>}
      {plans === null ? (
        <p className="text-sm text-velora-textMuted">Loading plans…</p>
      ) : plans.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-white/15 p-8 text-center">
          <h2 className="font-serif text-xl font-bold text-velora-textPrimary">Be the first tonight</h2>
          <p className="mt-2 text-sm text-velora-textSecondary">Say what you&apos;re in the mood for. Only the people you choose can reply.</p>
          <Link href="/tonight/new" className="mt-4 inline-block text-sm font-semibold text-velora-gold underline">Post a plan</Link>
        </section>
      ) : (
        <section className="space-y-4">{plans.map((plan) => <PlanCard key={plan.id} plan={plan} onReport={setReporting} />)}</section>
      )}

      {reporting && (
        <ReportModal isOpen onClose={() => setReporting(null)} targetUsername={reporting.authorName} targetProfileId={reporting.authorId} contentType="POST" contentId={reporting.id} />
      )}
    </main>
  );
}
