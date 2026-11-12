"use client";
import React from "react";
import { useSearchParams } from "next/navigation";

type Request = { id: string; email: string | null; identity: string; basedIn: string; intent: string; language: string; status: string; createdAt: string; decidedAt: string | null };

/** Approve or reject people who asked for an invitation on the landing page. */
export function AdminInvitationRequestsConsole() {
  const highlight = useSearchParams().get("request");
  const [pending, setPending] = React.useState<Request[]>([]);
  const [decided, setDecided] = React.useState<Request[]>([]);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [loaded, setLoaded] = React.useState(false);
  const load = React.useCallback(async () => {
    const response = await fetch("/api/admin/invitation-requests", { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    setLoaded(true);
    if (!response.ok) return setError(payload.error || "Requests unavailable");
    setPending(payload.pending || []); setDecided(payload.decided || []);
  }, []);
  React.useEffect(() => { void load(); }, [load]);
  async function decide(request: Request, decision: "APPROVED" | "REJECTED") {
    if (decision === "REJECTED" && !window.confirm(`Reject ${request.email}? Nothing is sent to them.`)) return;
    setBusy(request.id); setError(""); setNotice("");
    const response = await fetch("/api/admin/invitation-requests", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: request.id, decision }) });
    const payload = await response.json().catch(() => ({}));
    setBusy(null);
    if (!response.ok) { setError(payload.error || "Decision failed; refresh before retrying"); return void load(); }
    setNotice(decision === "APPROVED" ? `Invitation sent to ${request.email}.` : "Request rejected. Nothing was sent.");
    void load();
  }
  return <section className="space-y-4">
    <p className="max-w-3xl text-sm text-velora-ink2">People who asked for an invitation on the home page. Approving sends them a personal, single-use invitation valid for 30 days, in the language they used. Rejecting sends nothing. Their address is removed from this list once you decide.</p>
    {error && <p role="alert" className="text-velora-danger">{error}</p>}{notice && <p role="status" className="text-velora-success">{notice}</p>}
    {loaded && !pending.length && !error && <p className="text-sm text-velora-muted">No requests waiting.</p>}
    {pending.map(request => <article key={request.id} id={request.id} className={`rounded-xl border bg-velora-surface p-5 ${highlight === request.id ? "border-velora-accent ring-2 ring-velora-accent/40" : "border-velora-line"}`}>
      <p className="text-xs text-velora-muted">{new Date(request.createdAt).toLocaleString()} · {request.language === "cs" ? "Czech" : "English"}</p>
      <h3 className="mt-2 break-all text-lg font-bold">{request.email}</h3>
      <p className="mt-1 text-sm">{request.identity} · {request.basedIn}</p>
      <p className="mt-3 whitespace-pre-wrap rounded-lg bg-velora-paper p-3 text-sm">{request.intent}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button disabled={busy !== null} onClick={() => decide(request, "APPROVED")} className="min-h-11 rounded-lg bg-velora-accent px-5 font-semibold text-velora-paper disabled:opacity-50">{busy === request.id ? "Sending…" : "Approve and send invitation"}</button>
        <button disabled={busy !== null} onClick={() => decide(request, "REJECTED")} className="min-h-11 rounded-lg border border-velora-danger px-5 text-velora-danger disabled:opacity-50">Reject</button>
      </div>
    </article>)}
    {decided.length > 0 && <details className="rounded-xl border border-velora-line bg-velora-surface p-5"><summary className="cursor-pointer font-semibold">Recently decided ({decided.length})</summary><ul className="mt-3 space-y-2 text-sm">{decided.map(request => <li key={request.id}><strong className={request.status === "APPROVED" ? "text-velora-success" : "text-velora-danger"}>{request.status === "APPROVED" ? "Invited" : "Rejected"}</strong> · {request.identity} · {request.basedIn} · {request.decidedAt ? new Date(request.decidedAt).toLocaleString() : ""}</li>)}</ul></details>}
  </section>;
}
