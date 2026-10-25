"use client";

import React from "react";
import Link from "next/link";
import { Portrait } from "@/components/media/Portrait";
import { PlanCard, type Plan } from "@/components/plans/PlanCard";
import { ReportModal } from "@/components/safety/ReportModal";

/** A private deep link. Opening it never sends a reply or publishes a Story. */
export default function InvitationPage({ params }: { params: { id: string } }) {
  const [plan, setPlan] = React.useState<Plan | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [report, setReport] = React.useState(false);
  async function endInvitation() {
    if (!plan || !window.confirm("End this invitation now?")) return;
    try {
      const response = await fetch(`/api/dating-ads/${plan.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "END" }) });
      if (!response.ok) throw new Error();
      setPlan(null);
    } catch { setError("Could not confirm the invitation ended. Please refresh before retrying."); }
  }
  React.useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch(`/api/dating-ads?id=${encodeURIComponent(params.id)}`, { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Invitation unavailable");
        if (!controller.signal.aborted) { setPlan(data.plans?.[0] || null); setError(""); }
      } catch {
        if (!controller.signal.aborted) { setPlan(null); setError("This invitation could not be loaded. Please try again."); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void refresh();
    const timer = setInterval(refresh, 30_000);
    const focus = () => void refresh();
    window.addEventListener("focus", focus);
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener("focus", focus); };
  }, [params.id]);
  React.useEffect(() => {
    if (!plan) return;
    const timer = setTimeout(() => setPlan(null), Math.max(0, Date.parse(plan.expiresAt) - Date.now()));
    return () => clearTimeout(timer);
  }, [plan]);
  return <main className="mx-auto max-w-2xl px-5 pb-28 pt-6">
    <Link href="/tonight" className="inline-flex min-h-11 items-center underline">Back to Tonight</Link>
    {loading ? <p role="status" className="py-12">Opening invitation…</p> : !plan ? <div className="py-12"><h1 className="font-display text-4xl">This invitation is unavailable.</h1><p role="status" className="mt-4">{error || "It may have ended, or may no longer be visible to you."}</p></div> : <>
      <p className="mt-6 text-sm uppercase tracking-widest text-velora-accent">Take us out</p>
      <h1 className="mt-3 break-words font-display text-5xl leading-tight">{plan.title}</h1>
      <Link href={`/profile/${plan.authorId}`} className="mt-6 flex items-center gap-4 rounded-2xl border border-velora-line p-3">
        <Portrait src={plan.authorAvatar} name={plan.authorName} sizes="80px" className="h-20 w-20 shrink-0 overflow-hidden rounded-xl" />
        <span><span className="block text-lg font-semibold">{plan.authorName}</span><span className="text-sm text-velora-muted">Open profile & boundaries</span></span>
      </Link>
      <PlanCard showTitle={false} plan={plan} onEnd={endInvitation} onReport={() => setReport(true)}/>
      {error && <p role="alert">{error}</p>}
      <p className="mt-4 text-sm leading-relaxed text-velora-ink2">Send a private pitch: suggest a place, say what caught your eye, and give them something to say yes to. Replies go only to the host’s Messages. A couple profile speaks for that account; everyone involved still agrees for themselves.</p>
      <p className="mt-4 text-sm text-velora-muted">Chatting is a first step. Agree on the details together. Nobody owes a meeting, a reply or sex.</p>
      {report && <ReportModal isOpen onClose={() => setReport(false)} contentType="POST" contentId={plan.id} targetProfileId={plan.authorId} targetUsername={plan.authorName}/>}
    </>}
  </main>;
}
