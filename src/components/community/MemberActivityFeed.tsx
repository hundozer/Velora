"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, CalendarHeart, Images, ImageIcon, MessageSquareText, Play, UserPlus } from "lucide-react";

type FeedItem = {
  id: string;
  type: "PROFILE" | "DATING_AD" | "POST" | "ALBUM" | "IMAGE" | "VIDEO";
  actor: { id: string; displayName: string; avatarUrl?: string; verified: boolean };
  title: string;
  body?: string;
  category?: string;
  mediaUrl?: string;
  href: string;
  occurredAt: string;
};

const typeDetails = {
  PROFILE: { label: "Joined Intimo", icon: UserPlus, color: "text-velora-success" },
  DATING_AD: { label: "Dating post", icon: CalendarHeart, color: "text-velora-danger" },
  POST: { label: "New post", icon: MessageSquareText, color: "text-velora-accent" },
  ALBUM: { label: "New album", icon: Images, color: "text-cyan-300" },
  IMAGE: { label: "New photo", icon: ImageIcon, color: "text-velora-accent" },
  VIDEO: { label: "New video", icon: Play, color: "text-velora-signal" },
};

function relativeTime(value: string) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60); if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60); if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24); if (days < 30) return `${days}d ago`;
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(new Date(value));
}

function Avatar({ item }: { item: FeedItem }) {
  return item.actor.avatarUrl ? (
    <Image unoptimized src={item.actor.avatarUrl} alt="" width={48} height={48} className="h-12 w-12 rounded-full border border-velora-accent/30 object-cover" />
  ) : (
    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-velora-accent/30 bg-velora-accent/10 font-display text-lg font-bold text-velora-accent">{item.actor.displayName.slice(0, 1).toUpperCase()}</div>
  );
}

export function MemberActivityFeed() {
  const [scope, setScope] = React.useState("newest");
  const [contentType, setContentType] = React.useState("all");
  const [items, setItems] = React.useState<FeedItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  React.useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(false);
    fetch(`/api/feed?scope=${encodeURIComponent(scope)}&type=${encodeURIComponent(contentType)}`, { credentials: "same-origin", cache: "no-store", signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error("Feed unavailable"); return response.json(); })
      .then((payload) => setItems(Array.isArray(payload.items) ? payload.items : []))
      .catch((cause) => { if (cause.name !== "AbortError") setError(true); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [scope, contentType]);

  return (
    <main className="min-h-screen bg-velora-surface px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-velora-accent">What&apos;s happening</p><h1 className="mt-2 font-display font-semibold text-ink text-5xl leading-[1.02] sm:text-6xl">Around here</h1></div>
          <Link href="/people" className="text-sm font-semibold text-velora-accent hover:text-velora-accent">Find people</Link>
        </div>
        <section aria-label="Activity feed filters" className="mb-6 overflow-hidden rounded-2xl border border-ink/10 bg-velora-surface">
          <div className="flex border-b border-ink/10 px-3 sm:px-5">
            {[['newest','Newest'],['followed','Followed'],['friends','Friends']].map(([value, label]) => <button key={value} type="button" onClick={() => setScope(value)} aria-pressed={scope === value} className={`relative min-h-14 px-3 text-sm font-semibold transition sm:px-5 ${scope === value ? 'text-ink' : 'text-velora-textSecondary hover:text-ink'}`}>{label}{scope === value && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-velora-accent" />}</button>)}
          </div>
          <div className="flex gap-2 overflow-x-auto p-3 sm:p-4">
            {[['all','All'],['albums','Albums'],['photos','Photos'],['videos','Videos'],['posts','Text posts'],['dating','Dating']].map(([value, label]) => <button key={value} type="button" onClick={() => setContentType(value)} aria-pressed={contentType === value} className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition ${contentType === value ? 'bg-velora-accent text-velora-paper' : 'bg-ink/5 text-ink hover:bg-ink/10 hover:text-ink'}`}>{label}</button>)}
          </div>
        </section>
        {loading ? <div className="space-y-4" aria-label="Loading activity">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-56 animate-pulse rounded-2xl border border-ink/10 bg-ink/5" />)}</div>
          : error ? <div className="rounded-2xl border border-rose-300/25 bg-rose-300/10 p-6 text-rose-100">Activity could not be loaded. Please refresh and try again.</div>
          : items.length === 0 ? <div className="rounded-2xl border border-ink/10 bg-velora-surface p-10 text-center"><h2 className="text-xl font-semibold text-ink">Nothing here yet</h2><p className="mt-2 text-velora-textSecondary">{scope === 'followed' ? 'Follow members to see what they share here.' : scope === 'friends' ? 'Activity from mutually accepted friends will appear here.' : 'New community activity will appear here.'}</p><Link href="/people" className="mt-5 inline-flex rounded-lg bg-velora-accent px-5 py-3 font-bold text-velora-paper">Meet people</Link></div>
          : <div className="space-y-5">{items.map((item) => { const details = typeDetails[item.type]; const Icon = details.icon; return (
            <article key={item.id} className="overflow-hidden rounded-2xl border border-ink/10 bg-velora-surface shadow-xl shadow-black/10">
              <div className="flex items-center gap-3 p-5"><Link href={`/profile/${item.actor.id}`}><Avatar item={item} /></Link><div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><Link href={`/profile/${item.actor.id}`} className="truncate font-semibold text-ink hover:text-velora-accent">{item.actor.displayName}</Link>{item.actor.verified && <BadgeCheck className="h-4 w-4 text-velora-success" aria-label="Verified member" />}</div><div className={`mt-1 flex items-center gap-1.5 text-xs ${details.color}`}><Icon className="h-3.5 w-3.5" />{details.label}<span className="text-velora-textMuted">·</span><time className="text-velora-textSecondary" dateTime={item.occurredAt}>{relativeTime(item.occurredAt)}</time></div></div></div>
              {item.mediaUrl && <Link href={item.href} className="relative block aspect-[16/10] bg-black"><Image unoptimized src={item.mediaUrl} alt={item.title} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />{item.type === "VIDEO" && <span className="absolute inset-0 flex items-center justify-center"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur"><Play className="h-7 w-7 fill-current" /></span></span>}</Link>}
              <Link href={item.href} className="block p-5 pt-4 hover:bg-ink/[0.02]"><div className="flex items-start justify-between gap-4"><h2 className="text-xl font-semibold text-ink">{item.title}</h2>{item.category && <span className="shrink-0 rounded-full border border-ink/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink">{item.category}</span>}</div>{item.body && <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink">{item.body}</p>}</Link>
            </article>
          ); })}</div>}
      </div>
    </main>
  );
}
