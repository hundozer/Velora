"use client";
import { currentLang, LOCALE } from "@/lib/i18n/translate";
import { useTranslation } from "@/context/LanguageContext";
import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Plus } from "lucide-react";
import { PERSONAL_CATEGORIES } from "@/lib/personalAds.mjs";

const day = (iso: string) => new Date(iso).toLocaleDateString(LOCALE[currentLang()], { day: "numeric", month: "short" });
/** Short names for the category tabs; the full labels stay on the form. */
const SHORT: Record<string, string> = { HOOKUP: "Hookups", FUCK_BUDDY: "Fuck buddy", COUPLES: "Couples & threesomes", GROUP: "Groups & swingers", KINK: "Kink", ONLINE: "Online" };

type Ad = { id: string; authorId: string; authorName: string; authorAge: number | null; category: string; categoryLabel: string; title: string; body: string; boundaries: string; areaName: string | null; createdAt: string; expiresAt: string; status: string; moderationStatus: string; isMine: boolean; canReply: boolean; replyReason: string | null };
export default function DatingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [category, setCategory] = React.useState("");
  const [mine, setMine] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const [ads, setAds] = React.useState<Ad[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [replyId, setReplyId] = React.useState<string | null>(null);
  const [reply, setReply] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  React.useEffect(() => { if (new URLSearchParams(window.location.search).get("mine") === "1") setMine(true); setReady(true); }, []);
  const load = React.useCallback(async () => {
    if (!ready) return;
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const q = new URLSearchParams(); if (mine) q.set("mine", "true"); if (category) q.set("category", category);
      const response = await fetch(`/api/personal-ads?${q}`, { cache: "no-store" });
      const payload = await response.json(); if (!response.ok) throw Error(payload.error || "Dating ads unavailable");
      setAds(payload.ads || []); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Dating ads unavailable"); }
    finally { setLoading(false); }
  }, [user, mine, category, ready]);
  React.useEffect(() => { void load(); }, [load]);
  async function send(ad: Ad) {
    if (reply.trim().length < 10 || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiverId: ad.authorId, personalAdId: ad.id, content: reply.trim() }) });
      const payload = await response.json(); if (!response.ok) throw Error(payload.error || "Reply failed");
      setSent(true); setReply(""); setReplyId(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Reply failed"); }
    finally { setBusy(false); }
  }
  async function close(ad: Ad) {
    if (!window.confirm(t("Close this dating ad?"))) return;
    const response = await fetch(`/api/personal-ads/${ad.id}`, { method: "PATCH" });
    if (!response.ok) { const payload = await response.json().catch(() => ({})); setError(payload.error || "Could not close the ad"); return; }
    void load();
  }
  const tabs = [{ value: "", label: "Everything" }, ...PERSONAL_CATEGORIES.map(item => ({ value: item.value, label: SHORT[item.value] || item.label }))];
  const tab = (active: boolean) => `shrink-0 border-b-2 pb-3 pt-1 text-[15px] transition-colors ${active ? "border-velora-accent font-semibold text-velora-ink" : "border-transparent text-velora-muted hover:text-velora-ink"}`;
  return <main className="mx-auto max-w-4xl px-4 pb-28 pt-10 sm:px-6 md:pt-14">
    <header>
      <p className="text-[13px] font-semibold uppercase tracking-[0.2em] text-velora-muted">{t("Prague · adults only")}</p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <h1 className="font-display text-[clamp(2.5rem,8vw,3.75rem)] font-extrabold leading-none tracking-tight text-velora-ink">{t("Dating Ads")}</h1>
        <Link href="/personal-ads/new" className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-velora-accent px-5 text-[15px] font-semibold text-velora-paper"><Plus aria-hidden className="h-4 w-4" />{t("Post an ad")}</Link>
      </div>
      <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-velora-ink2">{t("Sex, kink, a fuck buddy, or someone to talk dirty with. Say what you want and where your limits are.")}</p>
    </header>
    <nav aria-label={t("What are you into?")} className="mt-8 border-b border-velora-line">
      <div className="-mb-px flex gap-6 overflow-x-auto [scrollbar-width:none]">{tabs.map(item => <button key={item.value || "all"} type="button" onClick={() => setCategory(item.value)} aria-pressed={category === item.value} className={tab(category === item.value)}>{t(item.label)}</button>)}</div>
    </nav>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-[14px]">
      <div role="group" aria-label={t("Whose ads")} className="inline-flex rounded-full border border-velora-line p-1">
        <button type="button" onClick={() => setMine(false)} aria-pressed={!mine} className={`rounded-full px-4 py-1.5 ${!mine ? "bg-velora-surface font-semibold text-velora-ink" : "text-velora-muted"}`}>{t("All ads")}</button>
        <button type="button" onClick={() => setMine(true)} aria-pressed={mine} className={`rounded-full px-4 py-1.5 ${mine ? "bg-velora-surface font-semibold text-velora-ink" : "text-velora-muted"}`}>{t("Yours")}</button>
      </div>
      <Link href="/tonight" className="text-velora-ink2 underline-offset-4 hover:underline">{t("Want it tonight? See Tonight →")}</Link>
    </div>
    {!user ? <p className="mt-12 text-[17px] text-velora-ink2">{t("Dating ads are for signed-in adults.")}{" "}<Link href="/login" className="text-velora-ink underline underline-offset-4">{t("Sign in")}</Link>.</p> : <>
      {error && <p role="alert" className="mt-6 text-velora-danger">{t(error)}</p>}
      {sent && <p role="status" className="mt-6 text-velora-ink2">{t("Reply sent. It's in")}{" "}<Link href="/messages" className="text-velora-ink underline underline-offset-4">{t("Messages")}</Link>.</p>}
      {loading ? <p role="status" className="mt-12 text-velora-muted">{t("Loading ads…")}</p> : !ads.length ? (
        <section className="mt-14 max-w-md">
          <h2 className="text-[24px] font-bold tracking-tight text-velora-ink">{mine ? t("You haven't posted an ad yet.") : category ? t("Nothing in this one yet.") : t("No ads right now.")}</h2>
          <p className="mt-2 text-[16px] leading-relaxed text-velora-ink2">{mine ? t("Say what you're after and what's off-limits. Ads run for 7 or 30 days.") : t("Be the first: post what you want, or try another category.")}</p>
          <Link href="/personal-ads/new" className="mt-5 inline-flex h-11 items-center rounded-full border border-velora-control px-5 text-[15px] font-semibold text-velora-ink hover:border-velora-ink">{t("Post an ad")}</Link>
        </section>
      ) : <ol className="mt-6 divide-y divide-velora-line">{ads.map(ad => <li key={ad.id} className="py-8">
        <article>
          <p className="flex flex-wrap gap-x-2 text-[13px]"><span className="font-semibold uppercase tracking-[0.12em] text-velora-accent">{t(SHORT[ad.category]) || t(ad.categoryLabel)}</span><span className="text-velora-muted">{ad.areaName || t("Area private")} · {day(ad.createdAt)}</span></p>
          <h2 className="mt-2 text-[26px] font-bold leading-tight tracking-tight text-velora-ink">{t(ad.title)}</h2>
          <Link className="mt-1 inline-block text-[15px] text-velora-ink2 underline-offset-4 hover:underline" href={`/profile/${ad.authorId}`}>{ad.authorName}{ad.authorAge ? `, ${ad.authorAge}` : ""}{" "}{t("· profile")}</Link>
          <p className="mt-4 whitespace-pre-wrap text-[16px] leading-7 text-velora-ink">{t(ad.body)}</p>
          <p className="mt-4 border-l-2 border-velora-accent pl-3 text-[15px] text-velora-ink2"><span className="font-semibold text-velora-ink">{t("Off-limits:")}</span> {ad.boundaries}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">{ad.isMine ? <><span className="text-[14px] text-velora-muted">{ad.status === "CLOSED" ? t("Closed") : ad.moderationStatus === "REJECTED" ? t("Removed by moderators") : t("Live until ") + day(ad.expiresAt)}</span>{ad.status === "ACTIVE" && <button onClick={() => close(ad)} className="min-h-11 text-[15px] text-velora-ink underline underline-offset-4">{t("Close ad")}</button>}</> : ad.canReply ? <button onClick={() => { setReplyId(ad.id === replyId ? null : ad.id); setSent(false); }} className="inline-flex min-h-11 items-center rounded-full bg-velora-accent px-5 text-[15px] font-semibold text-velora-paper">{t("Reply privately")}</button> : <span className="text-[14px] text-velora-ink2">{ad.replyReason === "VERIFIED" ? t("Verified members can reply") : t("You don't match this ad's reply rules")}</span>}</div>
          {replyId === ad.id && <div className="mt-5"><label className="block text-[14px] font-semibold text-velora-ink">{t("Your first message")}<textarea value={reply} onChange={event => setReply(event.target.value)} maxLength={4000} rows={4} placeholder={t("Be direct. Say why you're interested and respect what's off-limits.")} className="mt-2 w-full rounded-xl border border-velora-control bg-velora-sunken p-3 font-normal" /></label><p className="mt-2 text-[13px] text-velora-muted">{t("A reply starts a private chat. No one owes a response or a meeting.")}</p><button disabled={busy || reply.trim().length < 10} onClick={() => send(ad)} className="mt-3 inline-flex min-h-11 items-center rounded-full bg-velora-accent px-5 text-[15px] font-semibold text-velora-paper disabled:opacity-50">{busy ? t("Sending…") : t("Send reply")}</button></div>}
        </article>
      </li>)}</ol>}
    </>}
  </main>;
}
