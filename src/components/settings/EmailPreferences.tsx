"use client";

import React from "react";

const CATEGORIES = [
  { value: "MESSAGE", label: "New messages" },
  { value: "INTEREST", label: "Mutual interest" },
  { value: "PRIVATE_ACCESS", label: "Private photo requests and approvals" },
  { value: "PLAN_REPLY", label: "Replies to your plans" },
];

/** Settings → Emails (P1-11). Emails are discreet and sent only when you're away. */
export function EmailPreferences() {
  const [optOut, setOptOut] = React.useState<string[] | null>(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    fetch("/api/notifications/preferences", { credentials: "same-origin", cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((payload) => setOptOut(payload.optOut || []))
      .catch(() => setError("Email settings could not be loaded."));
  }, []);

  async function save(next: string[]) {
    const previous = optOut;
    setOptOut(next);
    setError("");
    const response = await fetch("/api/notifications/preferences", { method: "PUT", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ optOut: next }) });
    if (!response.ok) { setOptOut(previous); setError("Email settings could not be saved."); }
  }

  if (!optOut) return error ? <p className="text-xs text-velora-danger">{error}</p> : null;
  const allOff = optOut.includes("ALL");
  return (
    <div className="space-y-3">
      <p className="text-xs text-velora-textMuted">Sent only when you&apos;re away, at most every few hours, and never with names or message text.</p>
      {CATEGORIES.map((category) => {
        const on = !allOff && !optOut.includes(category.value);
        return (
          <label key={category.value} className={`flex items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-ink/5 p-4 ${allOff ? "opacity-50" : "cursor-pointer"}`}>
            <span className="text-sm text-velora-textPrimary">{category.label}</span>
            <input type="checkbox" className="h-4 w-4 accent-velora-gold" checked={on} disabled={allOff} onChange={() => save(on ? [...optOut, category.value] : optOut.filter((value) => value !== category.value))} />
          </label>
        );
      })}
      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-ink/5 p-4">
        <span className="text-sm text-velora-textPrimary">Pause all Intimo emails</span>
        <input type="checkbox" className="h-4 w-4 accent-velora-gold" checked={allOff} onChange={() => save(allOff ? optOut.filter((value) => value !== "ALL") : [...optOut, "ALL"])} />
      </label>
      {error && <p className="text-xs text-velora-danger" role="alert">{error}</p>}
    </div>
  );
}
