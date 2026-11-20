"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";

type RequestState = {
  room: { title: string; description: string; locked: boolean };
  status: "NONE" | "PENDING" | "CANCELLED" | "DECLINED" | "APPROVED" | "MEMBER";
  isOwner: boolean;
  isMember: boolean;
  retryAfter?: string | null;
};

export function RoomJoinRequestPanel({ roomId }: { roomId: string }) {
  const { t } = useTranslation();
  const endpoint = `/api/rooms/${encodeURIComponent(roomId)}/requests`;
  const [state, setState] = React.useState<RequestState | null>(null);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [notice, setNotice] = React.useState("");
  const reload = React.useCallback(async (signal?: AbortSignal) => {
    const response = await fetch(endpoint, { credentials: "same-origin", cache: "no-store", signal });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw Error(payload.error || "Room requests unavailable");
    setState(payload);
  }, [endpoint]);
  React.useEffect(() => {
    const controller = new AbortController();
    void reload(controller.signal).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [reload]);
  async function act(action: "REQUEST" | "CANCEL") {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(endpoint, { method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw Error(payload.error || "Request unavailable");
      await reload();
      setNotice(action === "REQUEST" ? "Request sent to room owner." : "Join request cancelled.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Request unavailable"); }
    finally { setBusy(false); }
  }
  if (!state || !state.room.locked || state.isOwner || state.isMember) return error ? <p role="alert" className="mt-4 text-sm text-velora-danger">{t(error)}</p> : null;
  return <section aria-label={t("Request room access")} className="mt-5 rounded-2xl border border-velora-line bg-velora-paper p-5">
    <p className="text-xs font-semibold uppercase tracking-widest text-velora-muted">{t("Members-only room")}</p>
    <h2 className="mt-2 font-display text-3xl text-velora-ink">{t(state.room.title)}</h2>
    <p className="mt-2 text-sm text-velora-ink2">{t(state.room.description)}</p>
    <p className="mt-4 text-sm text-velora-ink2">{t("Only approved members can read and participate. Sending a request does not grant access.")}</p>
    {state.status === "NONE" && <button disabled={busy} aria-busy={busy} type="button" onClick={() => void act("REQUEST")} className="intimo-member-primary mt-4 px-5 disabled:opacity-50">{t("Request to join")}</button>}
    {state.status === "PENDING" && <div className="mt-4 flex flex-wrap items-center gap-4">
      <span className="text-sm font-semibold text-velora-ink">{t("Awaiting owner's approval")}</span>
      <button disabled={busy} aria-busy={busy} type="button" onClick={() => void act("CANCEL")} className="intimo-member-secondary px-4 text-sm disabled:opacity-50">{t("Cancel request")}</button>
    </div>}
    {state.status === "DECLINED" && <p className="mt-4 text-sm font-semibold text-velora-ink">{t("Your request was declined.")}</p>}
    {state.status === "CANCELLED" && <div className="mt-4 space-y-3"><p className="text-sm text-velora-ink2">{t("Your request was cancelled. You can request again after 24 hours.")}</p>{(!state.retryAfter || Date.parse(state.retryAfter) <= Date.now()) && <button disabled={busy} aria-busy={busy} type="button" onClick={() => void act("REQUEST")} className="intimo-member-primary px-5 disabled:opacity-50">{t("Request again")}</button>}</div>}
    {state.status === "APPROVED" && <Link className="mt-4 inline-flex min-h-11 items-center underline" href={`/rooms/${encodeURIComponent(roomId)}`}>{t("Enter room")}</Link>}
    {error && <p role="alert" className="mt-3 text-sm text-velora-danger">{t(error)}</p>}
    {notice && <p role="status" aria-live="polite" className="mt-3 text-sm text-velora-ink">{t(notice)}</p>}
  </section>;
}
