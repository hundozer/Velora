"use client";

import React from "react";
import { Copy, Link2 } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export function MemberShareInvite({ onCreated, disabled = false }: { onCreated?: () => void; disabled?: boolean }) {
  const { t } = useTranslation();
  const [link, setLink] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      inputRef.current?.focus();
      inputRef.current?.select();
      setCopied(false);
      setError(t("Select and copy your link above."));
    }
  }

  async function create() {
    if (busy) return;
    setBusy(true);
    setError("");
    setCopied(false);
    try {
      const response = await fetch("/api/member/share-invite", {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Invitation link could not be created.");
      if (typeof payload.url !== "string" || !payload.url.startsWith("https://intimo.live/register?invite="))
        throw new Error("Invitation link could not be created.");
      setLink(payload.url);
      onCreated?.();
      // The link remains visible for manual copying if clipboard permission is denied.
      try { await navigator.clipboard.writeText(payload.url); setCopied(true); } catch { /* manual copy remains */ }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Invitation link could not be created.");
    } finally { setBusy(false); }
  }

  return (
    <div className="mt-5 space-y-3">
      <button type="button" onClick={link ? copy : create} disabled={busy || (!link && disabled)}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-velora-warm px-6 text-sm font-semibold text-velora-paper disabled:opacity-50">
        {link ? <Copy className="h-4 w-4" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />}
        {busy ? t("Creating link…") : link ? t("Copy my invite link") : t("Create and copy my invite link")}
      </button>
      <p className="text-xs leading-5 text-velora-textMuted">
        {t("Each link invites one person and expires after 30 days. Share it privately with someone you know.")}
      </p>
      {link && (
        <div className="space-y-2">
          <label htmlFor="my-share-invite" className="block text-xs font-semibold text-ink">{t("Your personal link")}</label>
          <input id="my-share-invite" ref={inputRef} type="text" readOnly value={link}
            onFocus={(event) => event.currentTarget.select()}
            className="w-full min-h-11 rounded-xl border border-velora-line bg-velora-surface px-3 text-sm text-ink" />
          <p role="status" className="text-xs text-velora-textSecondary">
            {copied ? t("Copied. Send it to someone you know.") : t("Your link is ready to copy.")}
          </p>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-velora-danger">{t(error)}</p>}
    </div>
  );
}
