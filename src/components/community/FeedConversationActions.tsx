"use client";

import Link from "next/link";
import React from "react";
import { ArrowUpRight, Bookmark, Check, MessageCircle, UsersRound } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

// These are ordinary navigation links. Server-side profile, messaging and room
// access checks remain the source of truth for every destination.
export function FeedCardActions({ type, href, actorId, selfId, targetId }: {
  type: "PROFILE" | "DATING_AD" | "POST" | "ALBUM" | "IMAGE" | "VIDEO" | "EVENT" | "ROOM";
  href: string;
  actorId: string;
  selfId?: string;
  targetId?: string;
}) {
  const { t } = useTranslation();
  const [saved, setSaved] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const isRoom = type === "ROOM";
  const isProfile = type === "PROFILE";
  const primaryLabel = isRoom ? "Enter conversation" : isProfile ? "View member" : type === "EVENT" ? "View event" : "View content";
  const showMember = !!actorId && !isRoom && !isProfile && actorId !== selfId;
  const showMessage = !!actorId && actorId !== selfId && !isRoom && type !== "EVENT";
  const savable = !!targetId && ["PROFILE","DATING_AD","POST","ALBUM","IMAGE","VIDEO"].includes(type);
  async function save() {
    if (!savable || saving) return;
    setSaving(true); setError("");
    try {
      const targetType = type === "IMAGE" || type === "VIDEO" ? "MEDIA" : type;
      const response = await fetch(saved
        ? `/api/saved-items?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId!)}`
        : "/api/saved-items", {
        method: saved ? "DELETE" : "POST", credentials: "same-origin",
        ...(saved ? {} : { headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetType, targetId }) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw Error(data.error || "Couldn't update saved items");
      setSaved(!saved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Couldn't update saved items");
    } finally { setSaving(false); }
  }

  return <nav aria-label={t("Activity actions")} className="flex flex-wrap items-center gap-2 border-t border-ink/10 px-4 py-3 sm:px-5">
    <Link href={href} className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-velora-warm px-4 text-sm font-semibold text-velora-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-velora-accent">
      {isRoom && <UsersRound aria-hidden className="h-4 w-4" />}{t(primaryLabel)}<ArrowUpRight aria-hidden className="h-4 w-4" />
    </Link>
    {showMember && <Link href={`/profile/${encodeURIComponent(actorId)}`} className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-ink underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-velora-accent">{t("View member")}</Link>}
    {savable && <button type="button" disabled={saving} onClick={() => void save()} aria-pressed={saved}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-ink/15 px-3 text-sm font-semibold text-ink disabled:opacity-50">
      {saved ? <Check aria-hidden className="h-4 w-4" /> : <Bookmark aria-hidden className="h-4 w-4" />}
      {t(saved ? "Saved" : "Save")}
    </button>}
    {showMessage && <Link href={`/messages?user=${encodeURIComponent(actorId)}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-ink underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-velora-accent"><MessageCircle aria-hidden className="h-4 w-4" />{t("Start a conversation")}</Link>}
    {error && <p role="alert" className="w-full text-sm text-velora-danger">{t(error)}</p>}
  </nav>;
}

export function FeedConversationDiscovery() {
  const { t } = useTranslation();
  return <aside aria-label={t("Find a conversation")} className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-velora-surface p-4 sm:p-5">
    <div className="min-w-0">
      <h2 className="font-display text-2xl text-ink">{t("More than a feed")}</h2>
      <p className="mt-1 max-w-lg text-sm leading-6 text-velora-textSecondary">{t("A post is a starting point. Meet people or join a room to keep the conversation going.")}</p>
    </div>
    <div className="flex w-full flex-wrap gap-2 sm:w-auto">
      <Link href="/rooms" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-velora-warm px-4 text-sm font-semibold text-velora-paper"><UsersRound aria-hidden className="h-4 w-4" />{t("Explore rooms")}</Link>
      <Link href="/people" className="inline-flex min-h-11 items-center rounded-full border border-ink/20 px-4 text-sm font-semibold text-ink">{t("Find people")}</Link>
    </div>
  </aside>;
}
