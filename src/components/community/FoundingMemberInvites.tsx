"use client";

import React from "react";
import { Mail, Send, Crown } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

type InviteRecord = {
  id: string; status: "PENDING" | "SENT" | "JOINED" | "EXPIRED" | "FAILED";
  createdAt: string; sentAt: string | null; joinedAt: string | null; firstContact: boolean;
};
type InviteStatus = {
  eligible: boolean; unlimited?: boolean; remaining?: number | null; allowance?: number;
  period?: string; error?: string;
  totals?: { issued: number; joined: number; awaiting: number; failed: number };
  history?: InviteRecord[];
};

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
      setMessage(t("Request received. If this person is not already a member, Intimo will send them an invitation."));
      setEmail(""); setPermissionConfirmed(false);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Invitation failed");
    } finally { setSending(false); }
  }

  const totals = status.totals;
  return <section aria-labelledby="founding-invite-heading" className="rounded-3xl border border-velora-gold/40 bg-velora-card p-6 sm:p-8">
    <div className="flex items-start gap-3">
      <Crown className="mt-1 h-6 w-6 shrink-0 text-velora-gold" aria-hidden />
      <div className="min-w-0 flex-1">
        <h2 id="founding-invite-heading" className="text-xl font-bold text-ink">{t("Invite friends")}</h2>
        <p className="mt-2 max-w-2xl text-sm text-velora-textSecondary">{t("Intimo is invitation-only. Bring people you know who would belong here.")}</p>
        <p className="mt-2 text-xs text-velora-textMuted">{status.unlimited ? t("Unlimited invitations for Founding Members.") : <>{t("Three invitations every three months.")} {typeof status.remaining === "number" ? `${status.remaining} ${t("remaining")}` : ""}</>}</p>
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
    {totals && <div className="mt-7 border-t border-ink/10 pt-6">
      <h3 className="text-sm font-bold text-ink">{t("Your invitations")}</h3>
      <p className="mt-1 text-xs leading-5 text-velora-textMuted">{t("Private totals. Recipient addresses and other members’ activity stay private.")}</p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {([
          [t("Sent"), totals.issued],
          [t("Joined"), totals.joined],
          [t("Awaiting signup"), totals.awaiting],
        ] as const).map(([label, value]) => (
          <div key={label} className="rounded-xl border border-ink/10 bg-ink/[0.025] px-3 py-4">
            <div className="text-2xl font-bold tabular-nums text-ink">{value}</div>
            <div className="mt-1 text-xs text-velora-textMuted">{label}</div>
          </div>
        ))}
      </div>
      {status.history && status.history.length > 0 && (
        <details className="mt-5 group">
          <summary className="cursor-pointer text-sm font-semibold text-velora-accent">{t("Recent invitations")}</summary>
          <div className="mt-3 divide-y divide-ink/10 rounded-xl border border-ink/10">
            {status.history.map((item, index) => {
              const label = item.status === "JOINED" ? t("Joined")
                : item.status === "EXPIRED" ? t("Expired")
                : item.status === "FAILED" ? t("Failed")
                : item.status === "PENDING" ? t("Processing") : t("Awaiting signup");
              return <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{t("Private invitation")} #{status.history!.length - index}</p>
                  <p className="mt-1 text-xs text-velora-textMuted">
                    {new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(item.createdAt))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-velora-accent">{label}</p>
                  {item.firstContact && <p className="mt-1 text-xs text-velora-textMuted">{t("First contact made")}</p>}
                </div>
              </div>;
            })}
          </div>
          <p className="mt-2 text-xs leading-5 text-velora-textMuted">{t("Sent means accepted by the email provider, not guaranteed inbox delivery. First contact means an observed message or interest.")}</p>
        </details>
      )}
    </div>}
  </section>;
}
