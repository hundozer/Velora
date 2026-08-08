"use client";

import React from "react";
import Link from "next/link";
import { Bookmark, FileText, Heart, Image as ImageIcon, MapPin, Search, Users, Video } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { BehindTheDoorLanding } from "@/components/landing/BehindTheDoorLanding";

type Results = { query: string; people: any[]; media: any[]; datingAds: any[]; posts: any[] };

export default function SearchPage() {
  const { user } = useAuth();
  const [query, setQuery] = React.useState("");
  const [submitted, setSubmitted] = React.useState("");
  const [results, setResults] = React.useState<Results | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (submitted.length < 2) return;
    const controller = new AbortController(); setLoading(true); setError("");
    fetch(`/api/search?q=${encodeURIComponent(submitted)}`, { credentials: "same-origin", cache: "no-store", signal: controller.signal })
      .then(async (response) => { const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload.error || "Search failed"); return payload; })
      .then(setResults).catch((cause) => { if (cause.name !== "AbortError") setError(cause.message || "Search failed"); }).finally(() => setLoading(false));
    return () => controller.abort();
  }, [submitted]);

  if (!user) return <BehindTheDoorLanding />;
  const total = results ? results.people.length + results.media.length + results.datingAds.length + results.posts.length : 0;
  const submit = (event: React.FormEvent) => { event.preventDefault(); const cleaned = query.trim(); if (cleaned.length < 2) { setError("Enter at least two characters."); return; } setSubmitted(cleaned); };

  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Member search</p><h1 className="mt-2 font-serif text-3xl font-semibold text-white">Search Intimo</h1><p className="mt-2 max-w-2xl text-sm text-slate-400">Find visible members, approved media, active dating ads, and moderated posts. Block and privacy settings are enforced before results are returned.</p>
    <form onSubmit={submit} className="mt-6 flex max-w-2xl gap-3"><label className="relative flex-1"><span className="sr-only">Search</span><Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-11 w-full rounded-lg border border-white/10 bg-[#11151e] pl-10 pr-3 text-sm text-white outline-none focus:border-amber-300/60" placeholder="Name, location, title, category…" maxLength={80} /></label><button className="min-h-11 rounded-lg bg-amber-300 px-5 text-sm font-bold text-slate-950">Search</button></form>
    {error && <p role="alert" className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">{error}</p>}
    {loading && <p className="mt-6 text-sm text-slate-400">Searching visible community records…</p>}
    {!loading && results && <div className="mt-7 space-y-9"><p className="text-sm text-slate-400">{total} {total === 1 ? "result" : "results"} for <strong className="text-white">{results.query}</strong></p>
      <ResultSection title="People" icon={<Users className="h-5 w-5" />} empty="No matching visible members.">{results.people.map((item) => <Link key={item.id} href={`/profile/${item.id}`} className="result-card"><strong>{item.displayName}{item.age ? `, ${item.age}` : ""}</strong><span>{item.profileType === "COUPLE" ? "Couple" : "Individual"}{item.verified ? " · Verified" : ""}</span>{item.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{item.location}</span>}<p>{item.headline || "Member profile"}</p></Link>)}</ResultSection>
      <ResultSection title="Media" icon={<ImageIcon className="h-5 w-5" />} empty="No matching approved media.">{results.media.map((item) => <article key={item.id} className="result-card"><strong className="flex items-center gap-2">{item.type === "VIDEO" ? <Video className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}{item.title}</strong><span>By <Link href={`/profile/${item.ownerId}`} className="text-amber-300 hover:underline">{item.ownerName}</Link>{item.category ? ` · ${item.category}` : ""}</span><p>{item.description || "Approved community media"}</p></article>)}</ResultSection>
      <ResultSection title="Dating ads" icon={<Heart className="h-5 w-5" />} empty="No matching active dating ads.">{results.datingAds.map((item) => <Link key={item.id} href={`/dating?ad=${item.id}`} className="result-card"><strong>{item.title}</strong><span>{item.category} · {item.ageRange}{item.location ? ` · ${item.location}` : ""}</span><p>Posted by {item.authorName}</p></Link>)}</ResultSection>
      <ResultSection title="Posts" icon={<FileText className="h-5 w-5" />} empty="No matching moderated posts.">{results.posts.map((item) => <article key={item.id} className="result-card"><strong>{item.title || "Community post"}</strong><span>{item.category || item.type} · {item.authorName}</span><p>{item.excerpt}</p></article>)}</ResultSection>
      <p className="flex items-center gap-2 text-xs text-slate-500"><Bookmark className="h-3.5 w-3.5" />Results are deterministic, newest-first within each category. Intimo does not use AI ranking.</p>
    </div>}
    <style jsx global>{`.result-card{display:flex;min-height:9rem;flex-direction:column;gap:.55rem;border:1px solid rgba(255,255,255,.1);border-radius:.75rem;background:#11151e;padding:1rem;color:#fff}.result-card:hover{border-color:rgba(252,211,77,.4)}.result-card span{font-size:.75rem;color:#94a3b8}.result-card p{font-size:.875rem;line-height:1.4;color:#cbd5e1}`}</style>
  </main>;
}

function ResultSection({ title, icon, empty, children }: { title: string; icon: React.ReactNode; empty: string; children: React.ReactNode[] }) {
  return <section><h2 className="flex items-center gap-2 text-lg font-semibold text-white">{icon}{title}</h2>{children.length ? <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div> : <p className="mt-3 rounded-lg border border-dashed border-white/10 p-4 text-sm text-slate-500">{empty}</p>}</section>;
}
