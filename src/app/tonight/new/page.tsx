"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { AreaSelect } from "@/components/profile/AreaSelect";
import { PLAN_CATEGORIES, PLAN_DURATIONS, PLAN_REPLY_TYPES } from "@/lib/plans.mjs";

const fieldClass = "w-full rounded-2xl border border-ink/10 bg-ink/5 px-4 py-3 text-sm text-velora-textPrimary outline-none focus:border-velora-gold/60 focus:ring-1 focus:ring-velora-gold/60";
const labelClass = "block space-y-2 text-xs font-semibold uppercase tracking-wider text-velora-textSecondary";
const chip = (on: boolean) => `min-h-10 rounded-full border px-4 text-sm transition ${on ? "border-velora-gold bg-velora-gold/15 text-velora-textPrimary" : "border-ink/10 text-velora-textSecondary hover:border-ink/25"}`;

/** Post a Plan (P1-07). Built to take well under a minute on a phone. */
export default function NewPlanPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [category, setCategory] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [text, setText] = React.useState("");
  const [validityDays, setValidityDays] = React.useState(1);
  const [areaId, setAreaId] = React.useState("");
  const [replyTypes, setReplyTypes] = React.useState<string[]>([]);
  const [minAge, setMinAge] = React.useState(18);
  const [maxAge, setMaxAge] = React.useState(99);
  const [requireVerified, setRequireVerified] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => { if (!areaId && profile?.areaId) setAreaId(profile.areaId); }, [profile?.areaId, areaId]);

  const valid = Boolean(category) && title.trim().length >= 3 && text.trim().length >= 10 && minAge <= maxAge;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid) return;
    setSubmitting(true);
    setError("");
    const response = await fetch("/api/dating-ads", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, title: title.trim(), text: text.trim(), validityDays, areaId: areaId || undefined, allowedReplyGenders: replyTypes, minAge, maxAge, requireVerified }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setError(payload.error || "Your plan could not be posted."); setSubmitting(false); return; }
    router.push("/tonight");
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 pb-24 pt-6">
      <Link href="/tonight" className="inline-flex items-center gap-1 text-xs text-velora-textMuted hover:text-velora-textPrimary"><ArrowLeft className="h-3.5 w-3.5" aria-hidden />Tonight</Link>
      <header>
        <h1 className="font-serif font-bold text-velora-textPrimary text-5xl leading-[1.02] sm:text-6xl">Post a plan</h1>
        <p className="mt-1 text-sm text-velora-textSecondary">Say what you&apos;re up for. It expires on its own, and only the people you choose can reply.</p>
      </header>

      <form onSubmit={submit} className="space-y-6">
        <fieldset className="space-y-3">
          <legend className={labelClass}>What kind of plan</legend>
          <div className="flex flex-wrap gap-2">
            {PLAN_CATEGORIES.map((item) => <button key={item.value} type="button" aria-pressed={category === item.value} onClick={() => setCategory(item.value)} className={chip(category === item.value)}>{item.label}</button>)}
          </div>
        </fieldset>

        <label className={labelClass}>Title
          <input className={fieldClass} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} placeholder="Drinks in Vinohrady, then see where it goes" />
        </label>
        <label className={labelClass}>Details
          <textarea className={`${fieldClass} min-h-28`} value={text} onChange={(event) => setText(event.target.value)} maxLength={1000} placeholder="Who you are, what you have in mind, anything people should know before replying." />
          <span className="block text-[11px] font-normal normal-case tracking-normal text-velora-textMuted">No payment, services or contact details. Plans offering paid services are removed.</span>
        </label>

        <fieldset className="space-y-3">
          <legend className={labelClass}>How long it stays up</legend>
          <div className="flex flex-wrap gap-2">
            {PLAN_DURATIONS.map((item) => <button key={item.days} type="button" aria-pressed={validityDays === item.days} onClick={() => setValidityDays(item.days)} className={chip(validityDays === item.days)}>{item.label}</button>)}
          </div>
        </fieldset>

        <label className={labelClass}>Area
          <AreaSelect className={fieldClass} value={areaId} onChange={setAreaId} />
        </label>

        <fieldset className="space-y-3">
          <legend className={labelClass}>Who may reply <span className="font-normal normal-case tracking-normal text-velora-textMuted">· none selected = everyone</span></legend>
          <div className="flex flex-wrap gap-2">
            {PLAN_REPLY_TYPES.map((item) => {
              const on = replyTypes.includes(item.value);
              return <button key={item.value} type="button" aria-pressed={on} onClick={() => setReplyTypes((current) => on ? current.filter((value) => value !== item.value) : [...current, item.value])} className={chip(on)}>{item.label}</button>;
            })}
          </div>
          <div className="flex items-center gap-3 text-sm text-velora-textSecondary">
            <span>Ages</span>
            <input type="number" min={18} max={99} value={minAge} onChange={(event) => setMinAge(Number(event.target.value))} className={`${fieldClass} w-20`} aria-label="Minimum age" />
            <span>to</span>
            <input type="number" min={18} max={99} value={maxAge} onChange={(event) => setMaxAge(Number(event.target.value))} className={`${fieldClass} w-20`} aria-label="Maximum age" />
          </div>
          <label className="flex items-center gap-3 text-sm text-velora-textSecondary">
            <input type="checkbox" className="h-4 w-4 accent-velora-gold" checked={requireVerified} onChange={(event) => setRequireVerified(event.target.checked)} />
            Verified members only
          </label>
        </fieldset>

        {error && <p role="alert" className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={!valid || submitting} className="min-h-12 w-full rounded-full bg-gold-gradient text-sm font-bold text-velora-bg disabled:opacity-50">{submitting ? "Posting…" : "Post plan"}</button>
      </form>
    </main>
  );
}
