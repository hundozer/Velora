"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import type { ConsentRecord, ConsentState, ConsentType } from "@/lib/privacy/consents.mjs";

type Payload = { consents: ConsentRecord[]; states: Record<ConsentType, ConsentState>; pendingErasure?: Partial<Record<ConsentType, boolean>> };

/**
 * FM-01: one card per consent. Each shows the exact wording, when it was given, and lets the
 * member give or withdraw it. Withdrawing deletes the covered data, so it asks first.
 * The wording here must match src/lib/privacy/consents.mjs (checked by tests/consents.test.mjs).
 */
export function ConsentSettings() {
  const { t, locale, language } = useTranslation();
  const [open, close] = language === "cs" ? ["„", "“"] : ["“", "”"];
  const [data, setData] = React.useState<Payload | null>(null);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState<ConsentType | null>(null);
  const [confirming, setConfirming] = React.useState<ConsentType | null>(null);
  const [agreed, setAgreed] = React.useState(false);

  const load = React.useCallback(() => {
    fetch("/api/privacy/consents", { credentials: "same-origin", cache: "no-store" })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((payload: Payload) => setData(payload))
      .catch(() => setError(t("Your consents could not be loaded. Please try again.")));
  }, [t]);
  React.useEffect(load, [load]);

  async function change(type: ConsentType, granted: boolean) {
    setBusy(type); setError("");
    let ok = false;
    try {
      const response = await fetch("/api/privacy/consents", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ consentType: type, granted }) });
      ok = response.ok;
    } catch { /* network failure: reported below */ }
    finally { setBusy(null); setConfirming(null); setAgreed(false); }
    // The error stays visible after the reload; a failed deletion also shows "Delete now".
    if (!ok) setError(t("That didn't work. Please try again."));
    load();
  }

  const date = (value: string | null) => (value ? new Date(value).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" }) : "");
  const status = (state?: ConsentState) => {
    if (!state) return "";
    if (state.granted) return t("Given on {date}", { date: date(state.since) });
    if (state.needsRenewal) return t("Given for an earlier wording. Please review it.");
    return t("Not given");
  };

  const cards: Array<{ type: ConsentType; title: string; wording: string; deletes: string }> = [
    {
      type: "SPECIAL_CATEGORY_PROFILE",
      title: t("Orientation and identity details"),
      wording: t("I explicitly consent to Intimo storing my sexual orientation and the identity details I choose to add, and showing them only to the audience I pick. I can withdraw this at any time in Settings, which deletes them."),
      deletes: t("Withdrawing deletes your orientation and identity details right away. You can add them again later."),
    },
    {
      type: "SPECIAL_CATEGORY_DESIRES",
      title: t("Desires"),
      wording: t("I explicitly consent to Intimo storing my desires and showing the visible ones to signed-in members. I can withdraw this in Privacy settings, which erases them."),
      deletes: t("Withdrawing deletes all your desires right away. You can add them again later."),
    },
  ];
  const titles = Object.fromEntries(cards.map((card) => [card.type, card.title])) as Record<string, string>;

  return (
    <section className="space-y-3" aria-labelledby="consent-title">
      <div>
        <h3 id="consent-title" className="flex items-center gap-2 text-xs font-bold text-ink"><ShieldCheck className="h-4 w-4 text-velora-success" aria-hidden />{t("Your consents")}</h3>
        <p className="mt-1 text-[11px] leading-5 text-velora-textMuted">{t("Intimo asks separately before storing the most personal parts of your profile. Each choice is recorded with its date and the exact wording you agreed to.")}</p>
      </div>
      {error && <p role="alert" className="text-xs font-semibold text-velora-danger">{error}</p>}
      {!data && !error && <p className="text-xs text-velora-textMuted">{t("Loading…")}</p>}
      {data && cards.map(({ type, title, wording, deletes }) => {
        const state = data.states[type];
        const granted = Boolean(state?.granted);
        return (
          <article key={type} className="rounded-2xl border border-ink/10 bg-ink/5 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="text-sm font-bold text-ink">{title}</h4>
              <p className={`text-[11px] font-semibold ${granted ? "text-velora-success" : "text-velora-textMuted"}`}>{status(state)}</p>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-velora-textSecondary">{open}{wording}{close}</p>

            {granted && confirming !== type && (
              <button type="button" onClick={() => setConfirming(type)} className="mt-3 min-h-9 rounded-full border border-ink/20 px-4 text-xs font-semibold text-ink hover:border-velora-danger hover:text-velora-danger">{t("Withdraw consent")}</button>
            )}
            {granted && confirming === type && (
              <div role="alertdialog" aria-label={t("Withdraw consent")} className="mt-3 rounded-xl border border-velora-danger/40 bg-velora-danger/10 p-3">
                <p className="text-xs font-semibold text-ink">{deletes}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" disabled={busy === type} onClick={() => void change(type, false)} className="min-h-9 rounded-full bg-velora-danger px-4 text-xs font-bold text-velora-paper disabled:opacity-60">{busy === type ? t("One moment…") : t("Withdraw and delete")}</button>
                  <button type="button" onClick={() => setConfirming(null)} className="min-h-9 rounded-full border border-ink/20 px-4 text-xs font-semibold text-ink">{t("Cancel")}</button>
                </div>
              </div>
            )}

            {!granted && data.pendingErasure?.[type] && (
              <div role="alert" className="mt-3 rounded-xl border border-velora-danger/40 bg-velora-danger/10 p-3">
                <p className="text-xs font-semibold text-ink">{t("You withdrew this consent, but some of these details are still stored. Delete them now.")}</p>
                <button type="button" disabled={busy === type} onClick={() => void change(type, false)} className="mt-3 min-h-9 rounded-full bg-velora-danger px-4 text-xs font-bold text-velora-paper disabled:opacity-60">{busy === type ? t("One moment…") : t("Delete now")}</button>
              </div>
            )}
            {!granted && !data.pendingErasure?.[type] && type === "SPECIAL_CATEGORY_DESIRES" && (
              <Link href="/me/desires" className="mt-3 inline-flex min-h-9 items-center rounded-full border border-velora-accent/40 px-4 text-xs font-semibold text-velora-accent">{t("Add desires")}</Link>
            )}
            {!granted && !data.pendingErasure?.[type] && type === "SPECIAL_CATEGORY_PROFILE" && (
              <div className="mt-3 space-y-2">
                <Link href="/me/identity" className="inline-flex min-h-9 items-center rounded-full border border-velora-accent/40 px-4 text-xs font-semibold text-velora-accent">{t("Add orientation and identity details")}</Link>
                <label className="flex items-start gap-2 text-[11px] leading-5 text-ink">
                  <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} className="mt-0.5 h-4 w-4 accent-velora-accent" />
                  <span>{t("I agree to the wording above.")}</span>
                </label>
                <button type="button" disabled={!agreed || busy === type} onClick={() => void change(type, true)} className="min-h-9 rounded-full bg-velora-warm px-4 text-xs font-semibold text-velora-paper disabled:opacity-50">{busy === type ? t("One moment…") : t("Give consent")}</button>
              </div>
            )}
          </article>
        );
      })}

      {data && data.consents.length > 0 && (
        <details className="rounded-2xl border border-ink/10 p-4">
          <summary className="cursor-pointer text-xs font-semibold text-ink">{t("Consent history")}</summary>
          <ul className="mt-3 divide-y divide-ink/10">
            {data.consents.map((row, index) => (
              <li key={`${row.consent_type}-${row.consent_timestamp}-${index}`} className="flex flex-wrap justify-between gap-2 py-2 text-[11px]">
                <span className="font-semibold text-ink">{titles[row.consent_type] || row.consent_type}</span>
                <span className="text-velora-textSecondary">{row.consent_status === "GRANTED" ? t("Given") : t("Withdrawn")} · {date(row.consent_timestamp)} · {row.consent_version}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
