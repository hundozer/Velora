"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";

type Pending = { requesterId: string; name: string; requestedAt: string };
export function RoomPendingRequests({ roomId }: { roomId: string }) {
  const { t } = useTranslation();
  const endpoint = `/api/rooms/${encodeURIComponent(roomId)}/requests`;
  const [pending, setPending] = React.useState<Pending[]>([]);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const refresh = React.useCallback(async (signal?: AbortSignal) => {
    const response = await fetch(endpoint, { cache: "no-store", credentials: "same-origin", signal });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw Error(payload.error || "Room requests unavailable");
    if (!payload.isOwner) throw Error("Room owner required");
    setPending(payload.pending || []);
  }, [endpoint]);
  React.useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [refresh]);
  async function decide(member: Pending, action: "APPROVE" | "DECLINE") {
    if (busy) return;
    setBusy(member.requesterId); setError(""); setNotice("");
    try {
      const response = await fetch(endpoint, { method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, requesterId: member.requesterId }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw Error(payload.error || "Request unavailable");
      await refresh();
      setNotice(action === "APPROVE" ? "Join request approved." : "Join request declined.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Request unavailable"); }
    finally { setBusy(null); }
  }
  return <section aria-labelledby="room-pending-title" className="mt-6 rounded-2xl border border-velora-line p-5">
    <h2 id="room-pending-title" className="font-display text-2xl">{t("Requests to join")} {pending.length ? <span className="text-base text-velora-muted">({pending.length})</span> : null}</h2>
    <p className="mt-2 text-sm text-velora-muted">{t("Requests do not grant access until you approve them.")}</p>
    {pending.length === 0 && !error && <p className="mt-4 text-sm text-velora-ink2">{t("No pending requests.")}</p>}
    <ul className="mt-4 divide-y divide-velora-line">
      {pending.map(member => <li key={member.requesterId} className="flex flex-wrap items-center justify-between gap-3 py-3">
        <Link href={`/profile/${member.requesterId}`} className="min-w-0 break-words font-semibold text-velora-ink underline">{member.name}</Link>
        <div className="flex flex-wrap gap-2">
          <button disabled={!!busy} aria-busy={busy === member.requesterId} type="button" onClick={() => void decide(member, "APPROVE")} className="intimo-member-primary px-4 text-sm disabled:opacity-50">{t("Approve")}</button>
          <button disabled={!!busy} type="button" onClick={() => void decide(member, "DECLINE")} className="intimo-member-secondary px-4 text-sm disabled:opacity-50">{t("Decline")}</button>
        </div>
      </li>)}
    </ul>
    {error && <p role="alert" className="mt-4 text-sm text-velora-danger">{t(error)}</p>}
    {notice && <p role="status" aria-live="polite" className="mt-4 text-sm text-velora-ink">{t(notice)}</p>}
  </section>;
}
