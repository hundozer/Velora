"use client";

import React from "react";
import { Mail, Send, Crown } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

type InviteStatus = { eligible: boolean; remaining?: number; error?: string };

export function FoundingMemberInvites() {
  const { t } = useTranslation();
  const [status, setStatus] = React.useState<InviteStatus | null>(null);
  const [email, setEmail] = React.useState("");
  const [permissionConfirmed, setPermissionConfirmed] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");
  const refresh = React.useCallback(async () => {
    try {
      const response = await fetch("/api/member/invitations", { cache: "no-store", credentials: "same-origin" });
      const data = await response.json();
      if (response.ok) setStatus(data);
    } catch { /* no invitation panel if unavailable */ }
  }, []);
  React.useEffect(() => { void refresh(); }, [refresh]);

  if (!status?.eligible) return null;

  async function send(event: React.FormEvent) {
    event.preventDefault();
    setSending(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/member/invitations", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), permissionConfirmed }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Invitation failed");
      setMessage(t("Invitation sent. Thank you for helping grow Intimo."));
      setEmail(""); setPermissionConfirmed(false);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Invitation failed");
    } finally { setSending(false); }
  }

  return <section aria-labelledby="founding-invite-heading" className="rounded-3xl border border-velora-gold/40 bg-velora-card p-6 sm:p-8">
    <div className="flex items-start gap-3">
      <Crown className="mt-1 h-6 w-6 shrink-0 text-velora-gold" aria-hidden />
      <div className="min-w-0 flex-1">
        <h2 id="founding-invite-heading" className="text-xl font-bold text-ink">{t("Founding Member invitations")}</h2>
        <p className="mt-2 max-w-2xl text-sm text-velora-textSecondary">{t("Help build the community. Invite people you know who would genuinely want to join Intimo.")}</p>
        <p className="mt-2 text-xs text-velora-textMuted">{t("Up to five invitations every 24 hours.")} {typeof status.remaining === "number" && `${status.remaining} ${t("remaining")}`}</p>
      </div>
    </div>
    <form onSubmit={send} className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
      <label className="block text-sm font-semibold text-ink">
        <span className="mb-2 inline-flex items-center gap-2"><Mail className="h-4 w-4" aria-hidden />{t("Their email address")}</span>
        <input required type="email" autoComplete="off" maxLength={254} value={email} onChange={event => setEmail(event.target.value)}
          placeholder="friend@example.com"
          className="block min-h-12 w-full rounded-xl border border-velora-line bg-velora-surface px-4 text-ink outline-none focus:ring-2 focus:ring-velora-gold" />
      </label>
      <button type="submit" disabled={sending || !email.trim() || !permissionConfirmed || status.remaining === 0}
        className="inline-flex min-h-12 items-center justify-center gap-2 self-end rounded-xl bg-velora-accent px-5 font-semibold text-velora-paper disabled:cursor-not-allowed disabled:opacity-40">
        <Send className="h-4 w-4" aria-hidden />{sending ? t("Sending…") : t("Send invitation")}
      </button>
      <label className="flex items-start gap-2 text-sm text-velora-textSecondary sm:col-span-2">
        <input type="checkbox" checked={permissionConfirmed} onChange={event => setPermissionConfirmed(event.target.checked)}
          className="mt-1 h-4 w-4 accent-amber-500"/>
        {t("I know this person and they agreed to receive an email invitation.")}
      </label>
      {message && <p role="status" className="text-sm text-velora-success sm:col-span-2">{message}</p>}
      {error && <p role="alert" className="text-sm text-velora-danger sm:col-span-2">{error}</p>}
    </form>
  </section>;
}
