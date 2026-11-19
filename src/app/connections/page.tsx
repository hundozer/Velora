"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/LanguageContext";
import { BehindTheDoorLanding } from "@/components/landing/BehindTheDoorLanding";

type Connection = { peerId: string; status: "CONNECTED" | "SENT" | "RECEIVED"; at: string; name: string; avatarUrl: string | null; city: string | null };
type Filter = "RECEIVED" | "CONNECTED" | "SENT";

export default function ConnectionsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [connections, setConnections] = React.useState<Connection[]>([]);
  const [filter, setFilter] = React.useState<Filter>("RECEIVED");
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");
  const refresh = React.useCallback(async () => {
    if (!user) return;
    const response = await fetch("/api/friends/list", { credentials: "same-origin", cache: "no-store" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Connections unavailable");
    setConnections(data.connections || []);
  }, [user]);
  React.useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);
    refresh().catch(error => { if (active) setError(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh, user]);
  const act = async (peerId: string, action: "ACCEPT" | "DECLINE" | "REMOVE") => {
    if (busy) return;
    setBusy(peerId); setError("");
    try {
      const response = await fetch("/api/friends", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetProfileId: peerId, action }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Connection action failed");
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Connection action failed"); }
    finally { setBusy(null); }
  };
  if (!user) return <BehindTheDoorLanding />;
  const tabs: { key: Filter; label: string }[] = [
    { key: "RECEIVED", label: "Requests" }, { key: "CONNECTED", label: "Connections" }, { key: "SENT", label: "Sent" },
  ];
  const selected = connections.filter(item => item.status === filter);
  return (
    <main className="mx-auto min-h-[70vh] max-w-3xl px-5 pb-28 pt-10 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-velora-copper">{t("Your circle")}</p>
      <h1 className="mt-2 font-display text-5xl leading-tight text-velora-ink">{t("Connections")}</h1>
      <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-velora-ink2">{t("A connection is mutual. Private albums and messages still follow each person's boundaries.")}</p>
      <div role="tablist" aria-label={t("Connections")} className="mt-8 flex border-b border-velora-line">
        {tabs.map(tab => <button role="tab" aria-selected={filter === tab.key} key={tab.key} onClick={() => setFilter(tab.key)} className={`min-h-12 flex-1 border-b-2 px-2 text-sm font-semibold ${filter === tab.key ? "border-velora-copper text-velora-ink" : "border-transparent text-velora-muted"}`}>{t(tab.label)} <span className="text-xs opacity-60">{connections.filter(item => item.status === tab.key).length || ""}</span></button>)}
      </div>
      {error && <p role="alert" className="mt-5 border-l-2 border-velora-crimson pl-3 text-sm text-velora-ink">{t(error)}</p>}
      {loading ? <p className="mt-8 text-velora-muted">{t("Loading…")}</p> : selected.length === 0 ? (
        <div className="mt-9 border border-velora-line bg-velora-surface px-6 py-10">
          <h2 className="font-display text-3xl text-velora-ink">{t(filter === "RECEIVED" ? "No requests waiting." : filter === "SENT" ? "No requests sent." : "Your circle starts here.")}</h2>
          <p className="mt-2 text-sm text-velora-ink2">{t("Connect with people you want to know beyond a single conversation.")}</p>
          <Link href="/people" className="mt-5 inline-flex min-h-11 items-center font-semibold text-velora-copperInk underline underline-offset-4">{t("Discover people")}</Link>
        </div>
      ) : (
        <div className="divide-y divide-velora-line">
          {selected.map(item => <article key={item.peerId} className="flex items-center gap-4 py-5">
            <Link href={`/profile/${item.peerId}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-velora-sunken">
              {item.avatarUrl ? <img src={item.avatarUrl} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center font-display text-2xl text-velora-ink">{item.name.slice(0,1)}</span>}
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/profile/${item.peerId}`} className="font-display text-2xl text-velora-ink hover:underline">{item.name}</Link>
              {item.city && <p className="text-xs text-velora-muted">{item.city}</p>}
              <p className="mt-1 text-xs text-velora-muted">{t(item.status === "RECEIVED" ? "Wants to connect" : item.status === "SENT" ? "Awaiting their answer" : "Connected")}</p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {item.status === "RECEIVED" && <>
                <button disabled={!!busy} onClick={() => void act(item.peerId, "ACCEPT")} className="min-h-11 bg-velora-accent px-4 text-sm font-semibold text-velora-paper disabled:opacity-50">{t("Accept")}</button>
                <button disabled={!!busy} onClick={() => void act(item.peerId, "DECLINE")} className="min-h-11 border border-velora-line px-3 text-sm text-velora-ink disabled:opacity-50">{t("Decline")}</button>
              </>}
              {item.status === "SENT" && <button disabled={!!busy} onClick={() => void act(item.peerId, "REMOVE")} className="min-h-11 border border-velora-line px-3 text-sm text-velora-ink disabled:opacity-50">{t("Cancel")}</button>}
              {item.status === "CONNECTED" && <><Link href={`/messages?user=${item.peerId}`} className="inline-flex min-h-11 items-center border border-velora-line px-3 text-sm font-semibold text-velora-ink">{t("Message")}</Link><button disabled={!!busy} onClick={() => { if (window.confirm(t("Remove this connection?"))) void act(item.peerId, "REMOVE"); }} className="min-h-11 px-3 text-sm text-velora-muted underline disabled:opacity-50">{t("Remove")}</button></>}
            </div>
          </article>)}
        </div>
      )}
    </main>
  );
}
