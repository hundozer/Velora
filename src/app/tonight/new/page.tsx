"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Sheet } from "@/components/editorial/Sheet";
import { AREAS, areaById } from "@/lib/areas.mjs";
import { PLAN_CATEGORIES, PLAN_REPLY_TYPES } from "@/lib/plans.mjs";
import { untilWords, windowFromClock } from "@/lib/tonight.mjs";

const WELCOME_WORDS: Record<string, string> = { "♀": "women", "♂": "men", "👫": "couples", "⚧": "trans and non-binary people" };
const listWords = (words: string[]) => words.length <= 1 ? words.join("") : `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
type SheetName = "day" | "area" | "welcome" | "kind" | null;

function Blank({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} className="inline-flex min-h-11 max-w-full items-center rounded-lg border border-velora-control bg-velora-sunken px-3 py-2 text-left text-base font-semibold text-velora-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-velora-accent">
      {children}
    </button>
  );
}

function pad(n: number) { return String(n).padStart(2, "0"); }
const SLOTS = Array.from({ length: 48 }, (_, i) => `${pad(Math.floor(i / 2))}:${i % 2 ? "30" : "00"}`);

/** A 24-hour time in half-hour steps that reads as part of the sentence. */
function TimeSelect({ value, onChange, className, label }: { value: string; onChange: (value: string) => void; className: string; label: string }) {
  const options = value && !SLOTS.includes(value) ? [value, ...SLOTS] : SLOTS;
  return (
    <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className={className} required>
      {!value && <option value="">--:--</option>}
      {options.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
    </select>
  );
}
/** The next half hour as "HH:MM", local time. */
function nextHalfHour(now: Date) {
  const next = new Date(now);
  next.setSeconds(0, 0);
  next.setMinutes(next.getMinutes() <= 30 ? 30 : 60);
  return `${pad(next.getHours())}:${pad(next.getMinutes())}`;
}
function plusHours(time: string, hours: number) {
  const [h, m] = time.split(":").map(Number);
  return `${pad((h + hours) % 24)}:${pad(m)}`;
}

/**
 * Extend an invitation: explicit activity, location, time and reply controls.
 * The server validates
 * everything again (start within 36 hours, 30 minutes to 12 hours, 18+ ages).
 */
export default function NewInvitationPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [day, setDay] = React.useState<"tonight" | "tomorrow">("tonight");
  const [title, setTitle] = React.useState("");
  const [areaId, setAreaId] = React.useState("");
  // Defaults depend on the clock, so they're set after mount (no server/browser mismatch).
  const [from, setFrom] = React.useState("");
  const [until, setUntil] = React.useState("");
  React.useEffect(() => { const start = nextHalfHour(new Date()); setFrom(start); setUntil(plusHours(start, 3)); }, []);
  const [replyTypes, setReplyTypes] = React.useState<string[]>([]);
  const [minAge, setMinAge] = React.useState(18);
  const [maxAge, setMaxAge] = React.useState(99);
  const [requireVerified, setRequireVerified] = React.useState(false);
  const [category, setCategory] = React.useState("DATE");
  const [text, setText] = React.useState("");
  const [sheet, setSheet] = React.useState<SheetName>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => { if (!areaId && profile?.areaId) setAreaId(profile.areaId); }, [profile?.areaId, areaId]);

  const slot = windowFromClock({ day, from, until });
  const hours = slot ? (new Date(slot.endsAt).getTime() - new Date(slot.startsAt).getTime()) / 3_600_000 : 0;
  const startsPast = slot ? new Date(slot.startsAt).getTime() < Date.now() - 10 * 60_000 : false;
  const timeProblem = !slot ? "Choose a start and an end." : startsPast ? "That start has passed. Choose a later time, or tomorrow." : hours < 0.5 ? "Make it at least half an hour." : hours > 12 ? "Invitations last up to 12 hours." : "";
  const welcome = replyTypes.length === 0 ? "everyone" : listWords(replyTypes.map((value) => WELCOME_WORDS[value]));
  const welcomeLine = `${requireVerified ? (replyTypes.length ? "verified " : "verified members, ") : ""}${welcome}${minAge > 18 || maxAge < 99 ? `, ${minAge} to ${maxAge}` : ""}`.replace(/^verified members, everyone/, "verified members");
  const area = areaById(areaId);
  const valid = title.trim().length >= 3 && text.trim().length >= 10 && !timeProblem && minAge <= maxAge;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid || !slot) return;
    setSubmitting(true);
    setError("");
    const response = await fetch("/api/dating-ads", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, title: title.trim(), text: text.trim(), startsAt: slot.startsAt, endsAt: slot.endsAt, areaId: areaId || undefined, allowedReplyGenders: replyTypes, minAge, maxAge, requireVerified }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setError(payload.error || "Your invitation could not be sent."); setSubmitting(false); return; }
    router.push("/tonight");
  }

  const timeInput = "mt-2 min-h-12 w-full cursor-pointer rounded-lg border border-velora-control bg-velora-sunken px-3 text-lg text-velora-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-velora-accent";

  return (
    <main className="mx-auto min-h-screen max-w-2xl bg-velora-surface px-6 pb-28 pt-4 sm:px-10 md:my-6 md:rounded-[28px] md:pt-8">
      <Link href="/tonight" className="inline-flex min-h-11 items-center gap-1.5 text-[15px] font-semibold text-velora-ink"><ArrowLeft className="h-4 w-4" aria-hidden />Tonight</Link>
      <h1 className="mt-4 font-display text-[44px] leading-none text-velora-ink">Extend an invitation</h1>

      <form onSubmit={submit} className="mt-8">
        <label className="block text-sm font-semibold text-velora-ink">What would you like to do?
          <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} placeholder="Talk kink over a drink" required className="mt-2 min-h-12 w-full rounded-lg border border-velora-control bg-velora-sunken px-3 text-lg font-normal text-velora-ink placeholder:text-velora-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-velora-accent"/>
        </label>
        <fieldset className="mt-6"><legend className="text-sm font-semibold">When & where</legend><div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2"><div><p className="mb-2 text-xs text-velora-ink2">Day</p><Blank onClick={() => setSheet("day")} label={`Day: ${day}`}>{day === "tonight" ? "Tonight" : "Tomorrow"}</Blank></div><div><p className="mb-2 text-xs text-velora-ink2">Neighbourhood</p><Blank onClick={() => setSheet("area")} label={`Area: ${area?.name || "choose"}`}>{area?.kind === "PRAGUE_DISTRICT" ? area.label.split(" · ")[0] : area?.name || "Choose neighbourhood"}</Blank></div></div><div className="mt-4 grid grid-cols-2 gap-4"><label className="min-w-0 text-sm font-semibold">Starts at<TimeSelect label="Starts at" value={from} onChange={setFrom} className={timeInput}/></label><label className="min-w-0 text-sm font-semibold">Ends at<TimeSelect label="Ends at" value={until} onChange={setUntil} className={timeInput}/></label></div></fieldset>
        <div className="mt-6"><p className="mb-2 text-sm font-semibold">Who may reply?</p><Blank onClick={() => setSheet("welcome")} label={`Who may reply: ${welcomeLine}`}>{welcomeLine}</Blank></div>

        {timeProblem ? <p role="status" className="mt-3 text-[15px] text-velora-crimson">{timeProblem}</p> : (
          <p className="mt-3 text-[15px] text-velora-muted">It disappears at {untilWords(until)}{hours > 0 && new Date(slot!.endsAt).getDate() !== new Date(slot!.startsAt).getDate() ? " (after midnight)" : ""}. Only the neighbourhood is shown.</p>
        )}

        <label className="mt-8 block">
          <span className="text-[13px] font-semibold uppercase tracking-[0.18em] text-velora-ink2">A few words for whoever reads it</span>
          <textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={1000} rows={4} required placeholder="What do you have in mind? What should someone know before saying yes?" className="mt-2 w-full resize-y rounded-lg border border-velora-control bg-velora-sunken p-3 text-[17px] leading-relaxed text-velora-ink placeholder:text-velora-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-velora-accent" />
          <span className="block text-[14px] text-velora-muted">No payment, services or contact details. Invitations offering paid services are removed.</span>
        </label>

        <p className="mt-6 text-[16px] text-velora-ink2">Kind of evening: <Blank onClick={() => setSheet("kind")} label="Kind of evening">{PLAN_CATEGORIES.find((item) => item.value === category)?.label.toLowerCase()}</Blank></p>

        {error && <p role="alert" className="mt-6 border-l-2 border-velora-crimson pl-4 text-[15px] text-velora-crimson">{error}</p>}
        <button type="submit" disabled={!valid || submitting} className="mt-8 min-h-14 w-full rounded-full bg-velora-accent text-[16px] font-semibold text-velora-paper disabled:opacity-40">{submitting ? "Sending…" : "Send the invitation"}</button>
        {!valid && !timeProblem && <p className="mt-2 text-center text-[14px] text-velora-muted">Say what you&apos;d like to do and add a few words.</p>}
      </form>

      <Sheet open={sheet === "day"} onClose={() => setSheet(null)} label="When">
        <h2 className="font-display text-[40px] leading-none text-velora-ink">When</h2>
        <div role="radiogroup" aria-label="When" className="mt-4">
          {(["tonight", "tomorrow"] as const).map((value) => (
            <button key={value} type="button" role="radio" aria-checked={day === value} onClick={() => { setDay(value); setSheet(null); }} className={`flex w-full items-baseline justify-between py-1.5 text-left font-display text-[30px] ${day === value ? "text-velora-ink" : "text-velora-muted"}`}>
              {value === "tonight" ? "Tonight" : "Tomorrow"}{day === value && <span className="font-sans text-[14px] text-velora-copperInk">Selected</span>}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[14px] text-velora-muted">Invitations start within the next 36 hours.</p>
      </Sheet>

      <Sheet open={sheet === "area"} onClose={() => setSheet(null)} label="Where">
        <h2 className="font-display text-[40px] leading-none text-velora-ink">Where</h2>
        <p className="mt-2 text-[14px] text-velora-muted">Only the neighbourhood is shown, never an address.</p>
        <div role="radiogroup" aria-label="Where" className="mt-4">
          {AREAS.filter((item) => item.kind === "PRAGUE_DISTRICT" || item.kind === "NEAR_PRAGUE").map((item) => (
            <button key={item.id} type="button" role="radio" aria-checked={areaId === item.id} onClick={() => { setAreaId(item.id); setSheet(null); }} className={`flex w-full items-baseline justify-between gap-4 py-1.5 text-left ${areaId === item.id ? "text-velora-ink" : "text-velora-muted"}`}>
              <span className="font-display text-[24px]">{item.kind === "PRAGUE_DISTRICT" ? item.label : item.name}</span>
              <span className="shrink-0 text-[14px]">{item.kind === "PRAGUE_DISTRICT" ? item.name : "Near Prague"}</span>
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet open={sheet === "welcome"} onClose={() => setSheet(null)} label="Who may reply" footer={<button type="button" onClick={() => setSheet(null)} className="min-h-14 w-full rounded-full bg-velora-accent text-[16px] font-semibold text-velora-paper">Done</button>}>
        <h2 className="font-display text-[40px] leading-none text-velora-ink">I&apos;d welcome</h2>
        <p className="mt-2 text-[14px] text-velora-muted">Choose none for everyone. Only people who fit can reply — it&apos;s checked when they send.</p>
        <div className="mt-4">
          {PLAN_REPLY_TYPES.map((item) => {
            const on = replyTypes.includes(item.value);
            return (
              <label key={item.value} className="flex min-h-12 items-center justify-between font-display text-[28px] text-velora-ink">
                {item.label}
                <input type="checkbox" checked={on} onChange={() => setReplyTypes((current) => on ? current.filter((value) => value !== item.value) : [...current, item.value])} className="h-6 w-6 accent-velora-ink" />
              </label>
            );
          })}
        </div>
        <h3 className="mb-2 mt-8 text-[13px] font-semibold uppercase tracking-[0.18em] text-velora-ink2">Aged</h3>
        <div className="flex items-baseline gap-3 font-display text-[28px] text-velora-ink">
          <input type="number" inputMode="numeric" min={18} max={99} value={minAge} aria-label="Youngest age" onChange={(event) => setMinAge(Math.min(99, Math.max(18, Number(event.target.value) || 18)))} className="w-16 border-b border-velora-ink/40 bg-transparent text-center focus:outline-none" />
          <span className="text-velora-muted">to</span>
          <input type="number" inputMode="numeric" min={18} max={99} value={maxAge} aria-label="Oldest age" onChange={(event) => setMaxAge(Math.min(99, Math.max(18, Number(event.target.value) || 99)))} className="w-16 border-b border-velora-ink/40 bg-transparent text-center focus:outline-none" />
        </div>
        <label className="mt-6 flex min-h-12 items-center justify-between gap-4 text-[16px] text-velora-ink">
          Verified members only
          <input type="checkbox" checked={requireVerified} onChange={(event) => setRequireVerified(event.target.checked)} className="h-6 w-6 accent-velora-ink" />
        </label>
      </Sheet>

      <Sheet open={sheet === "kind"} onClose={() => setSheet(null)} label="Kind of evening">
        <h2 className="font-display text-[40px] leading-none text-velora-ink">Kind of evening</h2>
        <div role="radiogroup" aria-label="Kind of evening" className="mt-4">
          {PLAN_CATEGORIES.map((item) => (
            <button key={item.value} type="button" role="radio" aria-checked={category === item.value} onClick={() => { setCategory(item.value); setSheet(null); }} className={`flex w-full items-baseline justify-between py-1.5 text-left font-display text-[28px] ${category === item.value ? "text-velora-ink" : "text-velora-muted"}`}>
              {item.label}{category === item.value && <span className="font-sans text-[14px] text-velora-copperInk">Selected</span>}
            </button>
          ))}
        </div>
      </Sheet>
    </main>
  );
}
