"use client";

/* eslint-disable @next/next/no-img-element */
import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BadgeCheck, Flag, Images } from "lucide-react";
import { ReportModal } from "@/components/safety/ReportModal";
import { useAuth } from "@/context/AuthContext";

type Album = {
  id: string; title: string; description?: string | null; category?: string | null; tags: string[];
  owner: { id: string; displayName: string; verified: boolean };
  photos: { id: string; title: string; description?: string | null; url: string }[];
};

export default function AlbumPage() {
  const params = useParams<{ id: string }>();
  const { user, isAuthLoading } = useAuth();
  const [album, setAlbum] = React.useState<Album | null>(null);
  const [error, setError] = React.useState("");
  const [reportOpen, setReportOpen] = React.useState(false);
  React.useEffect(() => {
    if (isAuthLoading) return;
    const endpoint = user ? `/api/albums/${encodeURIComponent(params.id)}` : `/api/public/albums/${encodeURIComponent(params.id)}`;
    fetch(endpoint, { credentials: "same-origin", cache: "no-store" }).then(async (response) => {
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Album unavailable");
      return payload;
    }).then((payload) => setAlbum(payload.album)).catch((cause) => setError(cause.message || "Album unavailable"));
  }, [params.id, user, isAuthLoading]);
  if (error) return <main className="mx-auto max-w-5xl p-8"><p role="alert" className="rounded-xl border border-velora-accent/30 p-5 text-velora-accent">{error}</p></main>;
  if (!album) return <main className="mx-auto max-w-5xl p-8 text-velora-textSecondary">Loading album…</main>;
  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <p className="text-xs font-semibold uppercase tracking-[.2em] text-velora-accent">{album.category || "Public album"}</p>
    <div className="mt-2 flex flex-wrap items-start justify-between gap-4"><div><h1 className="font-serif font-semibold text-ink text-5xl leading-[1.02] sm:text-6xl">{album.title}</h1><Link href={`/profile/${album.owner.id}`} className="mt-3 inline-flex items-center gap-1 text-sm text-ink">{album.owner.displayName}{album.owner.verified && <BadgeCheck className="h-4 w-4 text-emerald-700" />}</Link></div><button onClick={() => setReportOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-ink/15 px-4 text-sm text-ink hover:text-rose-700"><Flag className="h-4 w-4" />Report album</button></div>
    {album.description && <p className="mt-4 max-w-3xl text-velora-textSecondary">{album.description}</p>}
    {album.photos.length ? <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{album.photos.map((photo) => <figure key={photo.id} className="overflow-hidden rounded-xl border border-ink/10 bg-velora-surface"><img src={photo.url} alt={photo.title} className="aspect-square w-full object-cover" loading="lazy" /><figcaption className="p-3 text-sm text-ink">{photo.title}</figcaption></figure>)}</div> : <div className="mt-7 rounded-xl border border-dashed border-ink/15 p-12 text-center"><Images className="mx-auto h-8 w-8 text-velora-textMuted" /><p className="mt-3 text-ink">This album has no publicly available photos.</p></div>}
    <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} targetUsername={album.owner.displayName} targetProfileId={album.owner.id} contentType="ALBUM" contentId={album.id} />
  </main>;
}
