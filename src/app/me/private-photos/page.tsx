"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PersonTile, type Person } from "@/components/people/PersonTile";

type Entry = { viewer: Person; status: string; grantType: string | null; expiresAt: string | null; requestedAt: string };

/** Owner side of the Private Album Handshake (P1-06): answer requests, revoke access. */
export default function PrivatePhotosPage() {
  const [data, setData] = React.useState<{ requests: Entry[]; grants: Entry[] } | null>(null);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    const response = await fetch("/api/private-access?scope=incoming", { credentials: "same-origin", cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return setError(payload.error || "Requests could not be loaded.");
    setData(payload);
  }, []);
  React.useEffect(() => { void load(); }, [load]);

  async function decide(viewerId: string, decision: "GRANT_ONCE" | "GRANT" | "DENY" | "REVOKE") {
    setError("");
    const response = await fetch("/api/private-access", { method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ viewerId, decision }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return setError(payload.error || "That didn't work. Try again.");
    void load();
  }

  const button = "min-h-9 rounded-full px-3 text-xs font-semibold";
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 pb-24 pt-6">
      <Link href="/me" className="inline-flex items-center gap-1 text-xs text-velora-textMuted hover:text-velora-textPrimary"><ArrowLeft className="h-3.5 w-3.5" aria-hidden />Me</Link>
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-velora-gold">Private photos</p>
        <h1 className="font-serif font-bold text-velora-textPrimary text-5xl leading-[1.02] sm:text-6xl">Who can see them</h1>
        <p className="mt-1 text-sm text-velora-textSecondary">Photos in your private albums are visible only to people you approve here. Stopping access takes effect immediately.</p>
      </header>
      {error && <p role="alert" className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-700">{error}</p>}
      {!data ? <p className="text-sm text-velora-textMuted">Loading…</p> : (
        <>
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-velora-textSecondary">Requests</h2>
            {data.requests.length === 0 ? <p className="text-sm text-velora-textMuted">No requests waiting.</p> : data.requests.map((entry) => (
              <div key={entry.viewer.id} className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-ink/[0.02] p-3">
                <div className="w-24 shrink-0"><PersonTile person={entry.viewer} /></div>
                <div className="flex flex-1 flex-wrap gap-2">
                  <button type="button" onClick={() => decide(entry.viewer.id, "GRANT_ONCE")} className={`${button} bg-gold-gradient text-velora-bg`}>Share for 24 h</button>
                  <button type="button" onClick={() => decide(entry.viewer.id, "GRANT")} className={`${button} border border-velora-gold/50 text-velora-textPrimary`}>Share until I stop</button>
                  <button type="button" onClick={() => decide(entry.viewer.id, "DENY")} className={`${button} border border-ink/15 text-velora-textSecondary`}>Decline</button>
                </div>
              </div>
            ))}
          </section>
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-velora-textSecondary">Currently shared with</h2>
            {data.grants.length === 0 ? <p className="text-sm text-velora-textMuted">Nobody right now.</p> : data.grants.map((entry) => (
              <div key={entry.viewer.id} className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-ink/[0.02] p-3">
                <div className="w-24 shrink-0"><PersonTile person={entry.viewer} /></div>
                <div className="flex-1 space-y-2">
                  <p className="text-xs text-velora-textMuted">{entry.grantType === "ONCE" && entry.expiresAt ? `Until ${new Date(entry.expiresAt).toLocaleString()}` : "Until you stop sharing"}</p>
                  <button type="button" onClick={() => decide(entry.viewer.id, "REVOKE")} className={`${button} border border-red-400/40 text-red-700`}>Stop sharing</button>
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
