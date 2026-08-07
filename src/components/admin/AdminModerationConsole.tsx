"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type ModerationCase = {
  id: string;
  content_type: string;
  content_id?: string | null;
  reason: string;
  description: string;
  status: string;
  priority: string;
  decision?: string | null;
  decision_reason?: string | null;
  created_at: string;
};

export function AdminModerationConsole() {
  const [cases, setCases] = React.useState<ModerationCase[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const load = React.useCallback(() => {
    setLoading(true);
    fetch("/api/admin/moderation", { credentials: "same-origin" })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "Queue unavailable");
        setCases(payload.cases || []);
        setError("");
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Queue unavailable"))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(load, [load]);

  const updateCase = async (item: ModerationCase, status: string) => {
    const closing = status === "RESOLVED" || status === "REJECTED";
    const decision = closing ? window.prompt("Decision label")?.trim() : null;
    const decisionReason = closing ? window.prompt("Decision reason (required and auditable)")?.trim() : null;
    if (closing && (!decision || !decisionReason)) return;
    const response = await fetch("/api/admin/moderation", {
      method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, status, decision, decisionReason }),
    });
    if (response.ok) load();
  };

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-white">Moderation & Notice Action</h1>
        <p className="text-xs text-velora-textMuted mt-2">Server-authorized queue. Critical reports appear escalated. Financial and impersonation controls are disabled in the free MVP.</p>
      </div>
      {loading && <p className="text-sm text-velora-textMuted">Loading moderation cases…</p>}
      {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
      {!loading && !error && cases.length === 0 && <Card variant="glass" className="p-6 text-sm text-velora-textMuted">No moderation cases.</Card>}
      <div className="space-y-4">
        {cases.map((item) => (
          <Card key={item.id} variant="glass" className="p-5 space-y-3">
            <div className="flex flex-wrap justify-between gap-2">
              <div className="flex gap-2 text-[11px] font-mono"><span className="text-red-300">{item.priority}</span><span>{item.status}</span><span>{item.content_type}</span></div>
              <time className="text-[11px] text-velora-textMuted">{new Date(item.created_at).toLocaleString()}</time>
            </div>
            <h2 className="text-sm font-bold text-white">{item.reason.replaceAll("_", " ")}</h2>
            <p className="text-xs text-velora-textSecondary whitespace-pre-wrap">{item.description}</p>
            <p className="text-[10px] font-mono text-velora-textMuted">Case {item.id}{item.content_id ? ` • Content ${item.content_id}` : ""}</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="glass" size="sm" onClick={() => updateCase(item, "UNDER_REVIEW")}>Start review</Button>
              <Button variant="danger" size="sm" onClick={() => updateCase(item, "ACTION_REQUIRED")}>Action required</Button>
              <Button variant="gold" size="sm" onClick={() => updateCase(item, "RESOLVED")}>Resolve</Button>
              <Button variant="ghost" size="sm" onClick={() => updateCase(item, "REJECTED")}>Reject report</Button>
              <Button variant="danger" size="sm" onClick={() => updateCase(item, "ESCALATED")}>Escalate</Button>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
