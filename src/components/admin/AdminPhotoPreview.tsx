"use client";
import React from "react";

type Photo = { id: string; title?: string | null; moderation_status: string; upload_status: string; processing_status: string };

function PhotoTile({ photo, index }: { photo: Photo; index: number }) {
  const [failed, setFailed] = React.useState(false);
  const dialog = React.useRef<HTMLDialogElement>(null);
  const available = photo.upload_status === "AVAILABLE" && photo.processing_status === "READY" && photo.moderation_status !== "REMOVED";
  const url = `/api/admin/media/${photo.id}/preview`;
  const title = photo.title || `Photo ${index + 1}`;
  return <figure className="min-w-0 rounded-lg border border-velora-control p-3">
    {available && !failed ? <>
      <button type="button" onClick={() => dialog.current?.showModal()} className="block w-full rounded focus-visible:outline focus-visible:outline-2" aria-label={`Enlarge ${title}`}>
        {/* Protected same-origin endpoint; every image request rechecks admin and MFA. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={title} loading="lazy" onError={() => setFailed(true)} className="h-48 w-full rounded bg-velora-sunken object-contain" />
      </button>
      <dialog ref={dialog} className="max-h-[90vh] w-[min(95vw,1000px)] rounded-xl border border-velora-control bg-velora-surface p-4 text-velora-ink backdrop:bg-black/80" aria-label={title}>
        <div className="mb-3 flex items-center justify-between gap-4"><strong>{title}</strong><button type="button" autoFocus onClick={() => dialog.current?.close()} className="rounded border px-4 py-2">Close photo</button></div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={title} className="max-h-[75vh] w-full object-contain" onError={() => { dialog.current?.close(); setFailed(true); }} />
      </dialog>
    </> : <p role="status" className="flex min-h-32 items-center justify-center rounded bg-velora-sunken p-4 text-sm">{failed ? "Preview could not be loaded. Reopen photos to retry." : "Photo unavailable: removed, missing, or still processing."}</p>}
    <figcaption className="mt-2 break-words text-sm"><strong>{title}</strong><p className="text-xs text-velora-ink2">{photo.moderation_status} · {photo.upload_status} · {photo.processing_status}</p></figcaption>
  </figure>;
}

export function AdminPhotoPreview({ albumId, media }: { albumId?: string; media?: Photo }) {
  const [open, setOpen] = React.useState(false);
  const [photos, setPhotos] = React.useState<Photo[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const request = React.useRef<AbortController>();
  React.useEffect(() => () => request.current?.abort(), []);
  async function toggle() {
    if (open) { request.current?.abort(); setOpen(false); return; }
    setOpen(true); setError(""); setPhotos([]);
    if (media) { setPhotos([media]); return; }
    setLoading(true);
    const controller = new AbortController(); request.current = controller;
    try {
      const response = await fetch(`/api/admin/albums/${albumId}/photos`, { credentials: "same-origin", cache: "no-store", signal: controller.signal });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Photos unavailable");
      if (!controller.signal.aborted) setPhotos(payload.photos || []);
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Photos unavailable");
    } finally { if (!controller.signal.aborted) setLoading(false); }
  }
  return <section className="mt-4" aria-label="Moderation photo previews">
    <button type="button" onClick={toggle} aria-expanded={open} className="rounded-lg border border-velora-control px-4 py-2 text-sm font-semibold">{open ? "Close photos" : albumId ? "View album photos" : "View photo"}</button>
    {open && <div className="mt-3">
      {loading && <p role="status">Loading photos…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && !photos.length && <p>This album has no photos.</p>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{photos.map((photo, index) => <PhotoTile key={photo.id} photo={photo} index={index} />)}</div>
    </div>}
  </section>;
}
