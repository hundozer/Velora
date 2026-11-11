"use client";

import React from "react";

type Plan = { id: string; author_id: string; author_name: string; categoryLabel: string; title: string; text: string; created_at: string; expires_at: string };

/** Plans go live without approval; moderators can remove one with a reason shown to the author. */
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

  async function remove(id: string) {
    setError("");
    const response = await fetch("/api/admin/plans", { method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, decision: "REJECTED", reason: reasons[id] || "" }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return setError(payload.error || "Decision failed");
    void load();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-velora-ink2">Live plans, newest first. Plans go live as soon as they are posted; nothing needs approving. Remove anything offering paid services, contact details, minors or non-consent.</p>
      {error && <p role="alert" className="text-sm text-velora-danger">{error}</p>}
      {plans.length === 0 ? <p className="rounded-xl border bg-velora-surface p-5 text-sm text-velora-ink2">No live plans.</p> : plans.map((plan) => (
        <article key={plan.id} className="space-y-2 rounded-xl border bg-velora-surface p-4">
          <p className="text-xs text-velora-muted">{plan.categoryLabel} · by {plan.author_name} · posted {new Date(plan.created_at).toLocaleString()}</p>
          <h3 className="font-bold">{plan.title}</h3>
          <p className="whitespace-pre-line text-sm text-velora-ink2">{plan.text}</p>
          <input value={reasons[plan.id] || ""} onChange={(event) => setReasons({ ...reasons, [plan.id]: event.target.value })} placeholder="Reason shown to the author if removed (min 10 characters)" className="w-full rounded-lg border border-velora-control px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button onClick={() => remove(plan.id)} className="rounded-lg border border-velora-danger/40 px-3 py-1.5 text-xs font-bold text-velora-danger">Remove</button>
          </div>
        </article>
      ))}
    </div>
  );
}
