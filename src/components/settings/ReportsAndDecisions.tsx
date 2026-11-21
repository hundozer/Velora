"use client";

import React from "react";
import { useTranslation } from "@/context/LanguageContext";
import { ACTIONS, POLICY_GROUNDS } from "@/lib/moderation/outcomes.mjs";

type Appeal = { status: string; explanation: string | null; submittedAt: string; decidedAt: string | null } | null;
type Report = { id: string; contentType: string; reason: string; createdAt: string; state: "IN_REVIEW" | "ACTION_TAKEN" | "NO_BREACH" | "IN_APPEAL"; mayAppeal: boolean; appeal: Appeal };
type Decision = { id: string; contentType: string; decidedAt: string | null; action: string; ground: string | null; statement: string | null; mayAppeal: boolean; appeal: Appeal };

const CONTENT: Record<string, string> = { PROFILE: "A profile", PHOTO: "A photo", ALBUM: "An album", VIDEO: "A video", MESSAGE: "A message", POST: "A post", COMMENT: "A comment", COMMUNITY: "A room", EVENT: "A plan", LIVESTREAM: "A live stream" };
const STATE: Record<Report["state"], string> = { IN_REVIEW: "We're reviewing it", ACTION_TAKEN: "We took action", NO_BREACH: "No breach found", IN_APPEAL: "Being reviewed again" };
const APPEAL: Record<string, string> = { OPEN: "Your appeal is being reviewed", UNDER_REVIEW: "Your appeal is being reviewed", UPHELD: "Appeal decided: the decision stays", OVERTURNED: "Appeal decided: the decision was reversed", PARTIALLY_OVERTURNED: "Appeal decided: part of the decision was changed" };

/**
 * FM-07: Settings → Privacy Center. The member's reports with their outcome, the decisions
 * taken about them with a statement of reasons, and a way to ask for one review of each.
 */
export function ReportsAndDecisions() {
  const { t, locale } = useTranslation();
  const [data, setData] = React.useState<{ reports: Report[]; decisions: Decision[] } | null>(null);
  const [appealing, setAppealing] = React.useState<string | null>(null);
  const [reason, setReason] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [message, setMessage] = React.useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const load = React.useCallback(() => {
    fetch("/api/reports", { credentials: "same-origin", cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => setData(payload ? { reports: payload.reports || [], decisions: payload.decisions || [] } : null))
      .catch(() => setData(null));
  }, []);
  React.useEffect(() => { load(); }, [load]);

  async function submit() {
    if (!appealing || sending) return;
    setSending(true); setMessage(null);
    try {
      const response = await fetch(`/api/reports/${encodeURIComponent(appealing)}/appeal`, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason }) });
      if (!response.ok) { setMessage({ kind: "error", text: "Your appeal could not be sent. Please try again." }); return; }
      setAppealing(null); setReason(""); setMessage({ kind: "ok", text: "Thank you. Someone will look at it again and tell you the outcome." });
      load();
    } catch {
      setMessage({ kind: "error", text: "Your appeal could not be sent. Please try again." });
    } finally { setSending(false); }
  }

  if (!data || (data.reports.length === 0 && data.decisions.length === 0)) return null;
  const date = (value: string | null) => value ? new Date(value).toLocaleDateString(locale) : "";
  const appealBox = (id: string) => appealing === id && (
    <div className="mt-3 space-y-2">
      <label className="block text-xs"><span className="mb-2 block font-semibold">{t("Why should we look at this again?")}</span>
        <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} maxLength={4000} className="w-full rounded-xl border border-ink/10 bg-ink/5 p-3 text-ink" />
      </label>
      <p className="text-[11px] text-velora-textMuted">{t("At least 20 characters. You can appeal each decision once; a person reviews it.")}</p>
      <div className="flex gap-2">
        <button type="button" className="min-h-10 rounded-full border border-ink/15 px-4 text-xs" onClick={() => { setAppealing(null); setReason(""); }}>{t("Cancel")}</button>
        <button type="button" disabled={sending || reason.trim().length < 20} onClick={() => void submit()} className="min-h-10 rounded-full bg-velora-warm px-4 text-xs font-semibold text-velora-paper disabled:opacity-50">{sending ? t("Sending…") : t("Send appeal")}</button>
      </div>
    </div>
  );
  const appealLine = (appeal: Appeal) => appeal && (
    <div className="mt-2 rounded-lg border border-ink/10 p-2">
      <p className="font-semibold">{t(APPEAL[appeal.status] || "Your appeal is being reviewed")}</p>
      {appeal.explanation && <p className="mt-1 whitespace-pre-wrap text-velora-textSecondary">{appeal.explanation}</p>}
    </div>
  );
  const appealButton = (id: string, show: boolean) => show && appealing !== id && (
    <button type="button" className="mt-3 min-h-10 rounded-full border border-ink/15 px-4 text-xs font-semibold" onClick={() => { setAppealing(id); setReason(""); setMessage(null); }}>{t("Ask us to look again")}</button>
  );

  return (
    <div className="space-y-4">
      {data.decisions.length > 0 && <section id="decisions" className="space-y-3 rounded-2xl border border-ink/10 p-4">
        <div>
          <h4 className="text-xs font-bold text-velora-textPrimary">{t("Decisions about your account")}</h4>
          <p className="mt-1 text-[11px] text-velora-textMuted">{t("When we act after a report, we explain why here. A person made each decision, not an automated system. We never say who reported.")}</p>
        </div>
        {data.decisions.map((item) => (
          <article key={item.id} className="rounded-xl bg-ink/5 p-3 text-xs">
            <p className="flex flex-wrap justify-between gap-2"><strong>{t(ACTIONS[item.action] || "A decision")}</strong><span className="text-velora-textMuted">{date(item.decidedAt)}</span></p>
            <p className="mt-1 text-velora-textMuted">{t(CONTENT[item.contentType] || "Something you shared")}</p>
            {item.ground && <p className="mt-2"><span className="font-semibold">{t("Guideline:")}</span>{" "}{t(POLICY_GROUNDS[item.ground] || "Another community guideline")}</p>}
            {item.statement && <p className="mt-2 whitespace-pre-wrap text-velora-textSecondary">{item.statement}</p>}
            {appealLine(item.appeal)}
            {appealButton(item.id, item.mayAppeal)}
            {appealBox(item.id)}
          </article>
        ))}
      </section>}

      {data.reports.length > 0 && <section id="reports" className="space-y-3 rounded-2xl border border-ink/10 p-4">
        <div>
          <h4 className="text-xs font-bold text-velora-textPrimary">{t("Your reports")}</h4>
          <p className="mt-1 text-[11px] text-velora-textMuted">{t("What happened to the reports you sent. For the other member's privacy we don't share details of any action.")}</p>
        </div>
        {data.reports.map((item) => (
          <article key={item.id} className="rounded-xl bg-ink/5 p-3 text-xs">
            <p className="flex flex-wrap justify-between gap-2"><span>{t(CONTENT[item.contentType] || "Something you reported")}</span><span className="text-velora-textMuted">{date(item.createdAt)}</span></p>
            <p className="mt-1 font-semibold">{t(STATE[item.state])}</p>
            {appealLine(item.appeal)}
            {appealButton(item.id, item.mayAppeal)}
            {appealBox(item.id)}
          </article>
        ))}
      </section>}
      {message && <p role="status" className={`text-xs ${message.kind === "error" ? "text-velora-danger" : "text-velora-success"}`}>{t(message.text)}</p>}
    </div>
  );
}
