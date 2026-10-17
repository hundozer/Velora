"use client";

import React from "react";

type Plan = { id: string; author_id: string; author_name: string; categoryLabel: string; title: string; text: string; created_at: string; expires_at: string };

/** First-Plan review (P1-18): plans are already live; approve or remove with a reason. */
export function AdminPlansConsole() {
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [reasons, setReasons] = React.useState<Record<string, string>>({});
  const [error, setError] = React.useState("");
  const load = React.useCallback(async () => {
    const response = await fetch("/api/admin/plans", { credentials: "same-origin", cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return setError(payload.error || "Plans could not be loaded");
    setPlans(payload.plans || []);
  }, []);
  React.useEffect(() => { void load(); }, [load]);

  async function decide(id: string, decision: "APPROVED" | "REJECTED") {
    setError("");
    const response = await fetch("/api/admin/plans", { method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, decision, reason: reasons[id] || "" }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return setError(payload.error || "Decision failed");
    void load();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">First plans from new members go live straight away and wait here. Remove anything offering paid services, contact details, minors or non-consent.</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {plans.length === 0 ? <p className="rounded-xl border bg-white p-5 text-sm text-slate-600">Nothing waiting.</p> : plans.map((plan) => (
        <article key={plan.id} className="space-y-2 rounded-xl border bg-white p-4">
          <p className="text-xs text-slate-500">{plan.categoryLabel} · by {plan.author_name} · posted {new Date(plan.created_at).toLocaleString()}</p>
          <h3 className="font-bold">{plan.title}</h3>
          <p className="whitespace-pre-line text-sm text-slate-700">{plan.text}</p>
          <input value={reasons[plan.id] || ""} onChange={(event) => setReasons({ ...reasons, [plan.id]: event.target.value })} placeholder="Reason shown to the author if removed (min 10 characters)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button onClick={() => decide(plan.id, "APPROVED")} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">Approve</button>
            <button onClick={() => decide(plan.id, "REJECTED")} className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-bold text-red-700">Remove</button>
          </div>
        </article>
      ))}
    </div>
  );
}
