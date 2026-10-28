"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AREAS } from "@/lib/areas.mjs";
import { PERSONAL_CATEGORIES } from "@/lib/personalAds.mjs";

const TYPES = [{ value: "♀", label: "Women" }, { value: "♂", label: "Men" }, { value: "👫", label: "Couples" }, { value: "⚧", label: "Trans & non-binary people" }];
export default function NewDatingAdPage() {
  const { user, profile } = useAuth(); const router = useRouter();
  const [category, setCategory] = React.useState(""); const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState(""); const [boundaries, setBoundaries] = React.useState("");
  const [areaId, setAreaId] = React.useState(""); const [types, setTypes] = React.useState<string[]>([]);
  const [minAge, setMinAge] = React.useState(18); const [maxAge, setMaxAge] = React.useState(99);
  const [days, setDays] = React.useState(7); const [requireVerified, setRequireVerified] = React.useState(false);
  const [busy, setBusy] = React.useState(false); const [error, setError] = React.useState("");
  React.useEffect(() => { if (!areaId && profile?.areaId) setAreaId(profile.areaId); }, [areaId, profile?.areaId]);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy) return; setBusy(true); setError("");
    try {
      const response = await fetch("/api/personal-ads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category, title, body, boundaries, areaId, allowedReplyGenders: types, minAge, maxAge, days, requireVerified }) });
      const payload = await response.json(); if (!response.ok) throw Error(payload.error || "Could not post your ad");
      router.push("/dating?mine=1");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not post your ad"); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-2xl px-5 pb-28 pt-8"><Link href="/dating" className="text-sm underline">← Dating Ads</Link><h1 className="mt-7 font-display text-5xl">Say what you want.</h1><p className="mt-3 text-lg text-velora-ink2">Sex can be the point. Be clear about the people you want to meet and what is off-limits.</p>
    {!user ? <p className="mt-8"><Link href="/login" className="underline">Sign in</Link> to post.</p> : <form onSubmit={submit} className="mt-8 space-y-6">
      <label className="block font-semibold">What are you looking for?<select required value={category} onChange={event => setCategory(event.target.value)} className="mt-2 w-full rounded-lg border border-velora-control bg-velora-surface p-3"><option value="">Choose one</option>{PERSONAL_CATEGORIES.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <label className="block font-semibold">Headline<input required minLength={3} maxLength={100} value={title} onChange={event => setTitle(event.target.value)} placeholder="A regular fuck buddy in Prague 3" className="mt-2 w-full rounded-lg border border-velora-control bg-velora-surface p-3" /></label>
      <label className="block font-semibold">The details<textarea required minLength={20} maxLength={2000} rows={6} value={body} onChange={event => setBody(event.target.value)} placeholder="What do you want, what kind of connection, and what would make you say yes?" className="mt-2 w-full rounded-lg border border-velora-control bg-velora-surface p-3" /></label>
      <label className="block font-semibold">Off-limits<textarea required minLength={3} maxLength={500} rows={3} value={boundaries} onChange={event => setBoundaries(event.target.value)} placeholder="No photos in the first message. No surprise guests. Condoms required." className="mt-2 w-full rounded-lg border border-velora-control bg-velora-surface p-3" /></label>
      <label className="block font-semibold">Neighbourhood, not an address<select value={areaId} onChange={event => setAreaId(event.target.value)} className="mt-2 w-full rounded-lg border border-velora-control bg-velora-surface p-3"><option value="">Use my profile area</option>{AREAS.map(area => <option key={area.id} value={area.id}>{area.name}</option>)}</select></label>
      <fieldset className="rounded-xl border border-velora-line p-4"><legend className="px-2 font-semibold">Who can reply?</legend><p className="mb-3 text-sm text-velora-ink2">Leave all unchecked for everyone.</p><div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{TYPES.map(item => <label key={item.value} className="flex gap-2"><input type="checkbox" checked={types.includes(item.value)} onChange={event => setTypes(current => event.target.checked ? [...current, item.value] : current.filter(value => value !== item.value))}/>{item.label}</label>)}</div><div className="mt-4 flex gap-3"><label className="w-1/2 text-sm">Age from<input type="number" min={18} max={99} value={minAge} onChange={event => setMinAge(Number(event.target.value))} className="mt-1 w-full rounded border border-velora-control bg-velora-surface p-2" /></label><label className="w-1/2 text-sm">Age to<input type="number" min={18} max={99} value={maxAge} onChange={event => setMaxAge(Number(event.target.value))} className="mt-1 w-full rounded border border-velora-control bg-velora-surface p-2" /></label></div><label className="mt-4 flex gap-2"><input type="checkbox" checked={requireVerified} onChange={event => setRequireVerified(event.target.checked)}/>Verified members only</label></fieldset>
      <label className="block font-semibold">Keep it up for<select value={days} onChange={event => setDays(Number(event.target.value))} className="mt-2 w-full rounded-lg border border-velora-control bg-velora-surface p-3"><option value={7}>7 days</option><option value={30}>30 days</option></select></label>
      <p className="text-sm text-velora-ink2">Personal ads only. No prices, paid services, outside contact details, minors or non-consensual content. Your ad appears after moderator approval. A reply is not consent to a meeting or sex.</p>{error && <p role="alert" className="text-velora-danger">{error}</p>}
      <button disabled={busy || minAge > maxAge} className="min-h-12 w-full rounded-full bg-velora-accent font-bold text-velora-paper disabled:opacity-50">{busy ? "Posting…" : "Submit ad for review"}</button>
    </form>}
  </main>;
}
