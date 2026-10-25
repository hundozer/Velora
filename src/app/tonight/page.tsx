"use client";

import React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { BehindTheDoorLanding } from "@/components/landing/BehindTheDoorLanding";
import { ReportModal } from "@/components/safety/ReportModal";
import { Portrait } from "@/components/media/Portrait";
import { replyHref, sharePlanHref, PlanEventLink, type Plan } from "@/components/plans/PlanCard";
import { byHour, clock, glanceTime, groupTonight, openingLine, shortAudience } from "@/lib/tonight.mjs";
import { useDarkNav } from "@/lib/ui/navTone";

const portraitOf = (plan: Plan) => `${plan.authorIsCouple ? "Their" : "The"} portrait`;

/** "✓ You can reply — open to everyone." or why not, from the server's reply rule. */
function Eligibility({ plan, dark = false }: { plan: Plan; dark?: boolean }) {
  if (!plan.eligibilityText) return null;
  return <p className={`text-[14px] leading-snug ${dark ? "text-velora-onPhoto/85" : "text-velora-ink2"}`}>{plan.canReply ? "✓ " : ""}{plan.eligibilityText}</p>;
}

function ReportLink({ plan, onReport, dark = false }: { plan: Plan; onReport: (plan: Plan) => void; dark?: boolean }) {
  return <button type="button" onClick={() => onReport(plan)} aria-label={`Report this plan by ${plan.authorName}`} className={`min-h-11 text-[13px] underline underline-offset-4 ${dark ? "text-velora-onPhoto/60 hover:text-velora-onPhoto" : "text-velora-muted hover:text-velora-ink"}`}>Report</button>;
}

/** Happening now: the first live plan as a full spread — photograph or the time itself. */
function Featured({ plan, onReport }: { plan: Plan; onReport: (plan: Plan) => void }) {
  return (
    <article data-dark aria-label={`Happening now: ${plan.title}`} className="relative isolate flex min-h-[calc(100svh-4rem)] flex-col justify-end overflow-hidden bg-velora-night text-velora-onPhoto md:min-h-[640px] md:rounded-[28px]">
      {plan.authorAvatar ? (
        <>
          <Portrait src={plan.authorAvatar} name={plan.authorName} sizes="(min-width: 768px) 960px, 100vw" dominantColor="#191c20" className="absolute inset-0 -z-10 h-full w-full" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-velora-night from-[10%] via-velora-night/80 via-[45%] to-velora-night/20" />
        </>
      ) : (
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[34%] h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-velora-copper/25 blur-3xl" />
          <p className="absolute left-6 top-20 font-display text-[clamp(6rem,30vw,11rem)] leading-none text-velora-onPhoto/90 sm:left-10">{clock(plan.startsAt)}</p>
        </div>
      )}
      <div className="px-6 pb-10 pt-40 sm:px-10 md:max-w-2xl md:pb-14">
        <p className="flex items-center gap-2 text-[14px] text-velora-onPhoto/85"><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-velora-copperLight" />Happening now · since {clock(plan.startsAt)}</p>
        <h2 className="mt-3 font-display text-[clamp(2rem,8.5vw,3rem)] leading-[1.08]">{plan.title}</h2><PlanEventLink plan={plan}/>
        <p className="mt-4 text-[15px] text-velora-onPhoto/85">{plan.authorName}{plan.authorAge && !plan.authorIsCouple ? `, ${plan.authorAge}` : ""} · until {clock(plan.expiresAt)}{plan.areaName ? ` · ${plan.areaName}` : ""}</p>
        {plan.text && <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-velora-onPhoto/80">{plan.text}</p>}
        <div className="mt-3"><Eligibility plan={plan} dark /></div>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
          {plan.canReply && <Link href={replyHref(plan)} className="inline-flex min-h-12 items-center rounded-full bg-velora-accent px-6 text-[15px] font-semibold text-velora-paper">Reply to {plan.authorIsCouple ? "their" : "the"} invitation</Link>}
          <Link href={`/profile/${plan.authorId}`} className="min-h-11 py-3 text-[15px] text-velora-onPhoto underline decoration-velora-onPhoto/50 underline-offset-4">{portraitOf(plan)}</Link>
          <ReportLink plan={plan} onReport={onReport} dark />
        </div>
      </div>
    </article>
  );
}

/** Later tonight: a timeline with the hour as a marker and a copper rule. */
function Later({ title, plans, onReport }: { title: string; plans: Plan[]; onReport: (plan: Plan) => void }) {
  return (
    <section data-dark aria-label={title} className="bg-velora-night px-6 py-12 text-velora-onPhoto sm:px-10 md:rounded-[28px]">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.2em] text-velora-onPhoto/80">{title}</h2>
      <ol className="mt-6 space-y-8">
        {byHour(plans).map((bucket) => (
          <li key={bucket.hour} className="grid grid-cols-[3.25rem_1fr] gap-x-3">
            <span className="font-display text-[44px] leading-none text-velora-copperLight">{String(bucket.hour).padStart(2, "0")}</span>
            <ol className="space-y-8 border-l border-velora-copper/70 pl-6 pt-12">
              {bucket.plans.map((plan) => (
                <li key={plan.id} className="relative">
                  <span aria-hidden className="absolute -left-[1.84rem] top-3 h-2.5 w-2.5 rounded-full bg-velora-copper" />
                  <p className="font-display text-[34px] leading-none text-velora-copperLight">{clock(plan.startsAt)}<span className="ml-2 font-sans text-[14px] text-velora-onPhoto/75">until {clock(plan.expiresAt)}</span></p>
                  <h3 className="mt-2 font-display text-[25px] leading-[1.15]">{plan.title}</h3><PlanEventLink plan={plan}/>
                  <p className="mt-1 text-[14px] text-velora-onPhoto/75">{plan.authorName}{plan.areaName ? ` · ${plan.areaName}` : ""}</p>
                  <div className="mt-2"><Eligibility plan={plan} dark /></div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5">
                    {plan.canReply
                      ? <Link href={replyHref(plan)} className="inline-flex min-h-11 items-center rounded-full bg-velora-accent px-5 text-[15px] font-semibold text-velora-paper">Reply to {plan.authorName}</Link>
                      : <Link href={`/profile/${plan.authorId}`} className="min-h-11 py-3 text-[15px] text-velora-onPhoto underline decoration-velora-onPhoto/50 underline-offset-4">See {plan.authorName}&apos;s portrait</Link>}
                    <ReportLink plan={plan} onReport={onReport} dark />
                  </div>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Tomorrow (or the night after): quieter, on paper. */
function Tomorrow({ plans, onReport }: { plans: Plan[]; onReport: (plan: Plan) => void }) {
  return (
    <section aria-label="Upcoming" className="px-6 py-12 sm:px-10">
      <h2 className="font-display text-[40px] leading-none text-velora-ink">Upcoming</h2>
      <ol className="mt-6 divide-y divide-velora-line">
        {plans.map((plan) => (
          <li key={plan.id} className="py-6 first:pt-0">
            <p className="font-display text-[30px] leading-none text-velora-copperInk">{glanceTime(plan)}<span className="ml-2 font-sans text-[14px] text-velora-muted">until {clock(plan.expiresAt)}</span></p>
            <h3 className="mt-2 font-display text-[24px] leading-[1.15] text-velora-ink">{plan.title}</h3><PlanEventLink plan={plan}/>
            <p className="mt-1 text-[14px] text-velora-muted">{plan.authorName}{plan.areaName ? ` · ${plan.areaName}` : ""}</p>
            <div className="mt-2"><Eligibility plan={plan} /></div>
            <div className="mt-3 flex flex-wrap items-center gap-x-5">
              {plan.canReply
                ? <Link href={replyHref(plan)} className="inline-flex min-h-11 items-center rounded-full bg-velora-accent px-5 text-[15px] font-semibold text-velora-paper">Reply to {plan.authorName}</Link>
                : <Link href={`/profile/${plan.authorId}`} className="min-h-11 py-3 text-[15px] text-velora-ink underline underline-offset-4">See {plan.authorName}&apos;s portrait</Link>}
              <ReportLink plan={plan} onReport={onReport} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * Tonight (approved v33): plans in time order. An opening with the time and an at-a-glance
 * list, then what's happening now as a spread, later tonight as a timeline, then tomorrow.
 * Every plan shows its start, end, place and whether you can reply, decided by the same
 * rule POST /api/messages enforces.
 */
export default function TonightPage() {
  const { user } = useAuth();
  const [plans, setPlans] = React.useState<Plan[] | null>(null);
  const [eventFilter, setEventFilter] = React.useState<string | null>(null);
  const [mine, setMine] = React.useState<Plan[]>([]);
  const [error, setError] = React.useState("");
  const [reporting, setReporting] = React.useState<Plan | null>(null);
  // Set after mount so the server render and the browser never disagree about the time.
  const [now, setNow] = React.useState<Date | null>(null);
  const [darkVisible, setDarkVisible] = React.useState(false);
  const root = React.useRef<HTMLDivElement>(null);
  useDarkNav(darkVisible);

  const load = React.useCallback(async () => {
    setError("");
    setEventFilter(new URLSearchParams(window.location.search).get("event"));
    const [allResponse, mineResponse] = await Promise.all([
      fetch(`/api/dating-ads${new URLSearchParams(window.location.search).get("event") ? `?sceneEventId=${encodeURIComponent(new URLSearchParams(window.location.search).get("event")!)}` : ""}`, { credentials: "same-origin", cache: "no-store" }),
      fetch(`/api/dating-ads?mine=true${new URLSearchParams(window.location.search).get("event") ? `&sceneEventId=${encodeURIComponent(new URLSearchParams(window.location.search).get("event")!)}` : ""}`, { credentials: "same-origin", cache: "no-store" }),
    ]);
    const all = await allResponse.json().catch(() => ({}));
    const own = await mineResponse.json().catch(() => ({}));
    if (!allResponse.ok) { setError(all.error || "Plans could not be loaded."); setPlans([]); return; }
    setPlans((all.plans || []).filter((plan: Plan) => !plan.isMine));
    setMine((own.plans || []).filter((plan: Plan) => plan.live));
    setNow(new Date());
  }, []);

  React.useEffect(() => { if (user) void load(); }, [user, load]);
  // Keep "now" honest while the page stays open.
  React.useEffect(() => { setNow(new Date()); const timer = window.setInterval(() => setNow(new Date()), 60_000); return () => window.clearInterval(timer); }, []);

  // The bottom navigation turns dark while a dark section fills the bottom of the screen.
  React.useEffect(() => {
    const nodes = root.current ? Array.from(root.current.querySelectorAll("[data-dark]")) : [];
    if (!nodes.length || typeof IntersectionObserver === "undefined") { setDarkVisible(false); return; }
    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target);
      setDarkVisible(visible.size > 0);
    }, { rootMargin: "-92% 0px 0px 0px" });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [plans]);

  async function endPlan(id: string) {
    if (!window.confirm("End this invitation now? It disappears for everyone.")) return;
    const response = await fetch(`/api/dating-ads/${encodeURIComponent(id)}`, { method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "END" }) });
    if (response.ok) void load();
  }

  if (!user) return <BehindTheDoorLanding />;

  const { happening, later, tomorrow } = groupTonight(now ? plans || [] : [], now ?? undefined);
  const featured = happening[0] ?? null;
  const glance = [...happening, ...later, ...tomorrow].slice(0, 6);

  return (
    <div ref={root} className="min-h-screen bg-velora-surface pb-20 md:pb-12">
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-velora-blush via-velora-surface to-velora-surface md:mx-auto md:mt-6 md:max-w-5xl md:rounded-[28px]">
        <div aria-hidden className="absolute -right-24 top-10 -z-10 h-80 w-80 rounded-full bg-velora-copperLight/30 blur-3xl" />
        <header className="flex items-center justify-between px-6 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-10 md:pt-6">
          <Link href="/" className="font-display text-[28px] leading-none text-velora-ink md:invisible">Intimo</Link>
          <Link href={eventFilter ? `/tonight/new?event=${encodeURIComponent(eventFilter)}` : "/tonight/new"} className="inline-flex min-h-11 items-center gap-1.5 text-[15px] font-semibold text-velora-ink"><Plus className="h-4 w-4" aria-hidden />Invite</Link>
        </header>
        <div className="px-6 pb-10 pt-8 sm:px-10">
          <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-velora-copperInk">{now ? openingLine(now) : "Prague, tonight"}</p>
          {eventFilter && <p className="mt-3 text-sm text-velora-ink2">Company invitations for this event · <Link href={`/scene?event=${encodeURIComponent(eventFilter)}`} className="text-velora-accent underline">View event</Link> · <a href="/tonight" className="text-velora-accent underline">All Plans</a></p>}
          <h1 className="mt-3 font-display text-[clamp(3rem,13vw,4.5rem)] leading-[0.98] text-velora-ink">Take us out.<br /><em className="text-velora-copperInk">Or make the first move.</em></h1>

          {error && <p role="alert" className="mt-6 border-l-2 border-velora-crimson pl-4 text-[15px] text-velora-crimson">{error}</p>}
          {plans === null || !now ? (
            <ul aria-hidden className="mt-8 space-y-5">{[0, 1, 2].map((i) => <li key={i} className="flex gap-5"><span className="h-7 w-14 bg-velora-sunken" /><span className="flex-1 space-y-2"><span className="block h-4 w-40 bg-velora-sunken" /><span className="block h-3 w-28 bg-velora-sunken/70" /></span></li>)}</ul>
          ) : glance.length === 0 ? (
            <div className="mt-8">
              <p className="text-[17px] text-velora-ink2">A drink that turns into flirting. A table for three. A night worth getting dressed for. Tell Prague what you have in mind.</p>
              <Link href={eventFilter ? `/tonight/new?event=${encodeURIComponent(eventFilter)}` : "/tonight/new"} className="mt-5 inline-flex min-h-12 items-center rounded-full bg-velora-accent px-6 text-[16px] font-semibold text-velora-paper">Extend an invitation</Link>
            </div>
          ) : (
            <ol aria-label="At a glance" className="mt-8 divide-y divide-velora-line/80">
              {glance.map((plan) => (
                <li key={plan.id} className="grid grid-cols-[5.5rem_1fr_auto] items-baseline gap-x-3 py-3.5">
                  <span className="font-display text-[26px] leading-none text-velora-copperInk">{glanceTime(plan, now ?? undefined)}</span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 block text-[16px] font-semibold leading-snug text-velora-ink">{plan.title}</span>
                    <span className="block truncate text-[14px] text-velora-muted">{plan.authorName} · until {clock(plan.expiresAt)}</span>
                  </span>
                  {plan.canReply
                    ? <Link href={replyHref(plan)} className="min-h-11 py-2 text-[15px] font-semibold text-velora-ink underline underline-offset-4">Reply</Link>
                    : <span className="max-w-[7.5rem] text-right text-[13px] leading-tight text-velora-muted">{shortAudience(plan.audience)}</span>}
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-0 md:mt-6 md:space-y-6">
        {mine.length > 0 && (
          <section aria-label="Your invitations" className="px-6 py-10 sm:px-10">
            <h2 className="font-display text-[34px] leading-tight text-velora-ink">{mine.length === 1 ? "Your invitation" : "Your invitations"}</h2>
            <ol className="mt-4 divide-y divide-velora-line">
              {mine.map((plan) => (
                <li key={plan.id} className="py-4">
                  <p className="font-display text-[24px] leading-none text-velora-copperInk">{clock(plan.startsAt)}<span className="ml-2 font-sans text-[14px] text-velora-muted">until {clock(plan.expiresAt)}</span></p>
                  <p className="mt-1.5 font-display text-[22px] leading-tight text-velora-ink">{plan.title}</p><PlanEventLink plan={plan}/>
                  <p className="mt-1 text-[14px] text-velora-muted">Open to {plan.audience || "everyone"}. Replies arrive in Messages.</p>
                  <Link href={sharePlanHref(plan)} className="mr-6 inline-flex min-h-11 items-center text-[15px] text-velora-accent underline">Share to your Story</Link>
                  <button type="button" onClick={() => void endPlan(plan.id)} className="mt-1 min-h-11 text-[15px] text-velora-ink underline underline-offset-4">End it now</button>
                </li>
              ))}
            </ol>
          </section>
        )}
        {featured && <Featured plan={featured} onReport={setReporting} />}
        {happening.length > 1 && <Later title="Also happening now" plans={happening.slice(1)} onReport={setReporting} />}
        {later.length > 0 && <Later title="Later tonight" plans={later} onReport={setReporting} />}
        {tomorrow.length > 0 && <Tomorrow plans={tomorrow} onReport={setReporting} />}
        {plans && plans.length > 0 && (
          <section aria-label="Extend an invitation" className="px-6 py-12 sm:px-10">
            <h2 className="font-display text-[40px] leading-none text-velora-ink">Extend an invitation</h2>
            <p className="mt-4 font-display text-[24px] leading-[1.5] text-velora-muted">Tonight I&apos;d like to … in … from … until … I&apos;d welcome …</p>
            <Link href={eventFilter ? `/tonight/new?event=${encodeURIComponent(eventFilter)}` : "/tonight/new"} className="mt-5 inline-flex min-h-12 items-center rounded-full bg-velora-accent px-6 text-[16px] font-semibold text-velora-paper">Write yours</Link>
          </section>
        )}
      </div>

      {reporting && (
        <ReportModal isOpen onClose={() => setReporting(null)} targetUsername={reporting.authorName} targetProfileId={reporting.authorId} contentType="POST" contentId={reporting.id} />
      )}
    </div>
  );
}
