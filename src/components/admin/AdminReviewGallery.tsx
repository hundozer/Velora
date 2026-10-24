'use client';
import React from 'react';
import { Expand, ChevronLeft, ChevronRight, LockKeyhole } from 'lucide-react';
import { photoReady } from '@/lib/admin/workspace.mjs';
import { buttonClass, type ReviewPhoto } from './workspaceTypes';

export function AdminReviewGallery({ photos, index, onIndex }: { photos: ReviewPhoto[]; index: number; onIndex: (index: number) => void }) {
  const [failed, setFailed] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState(false);
  const dialog = React.useRef<HTMLDialogElement>(null);
  const photo = photos[index];
  if (!photo) return <p className="flex min-h-80 items-center justify-center rounded-xl border border-dashed border-velora-control p-8 text-sm text-velora-ink2">This album has no photos. It cannot be approved.</p>;
  const title = photo.title || `Photo ${index + 1}`;
  const url = `/api/admin/media/${photo.id}/preview`;
  const available = photoReady(photo) && failed !== photo.id;
  return <section aria-label="Review photos" onKeyDown={event => {
    if (expanded) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); onIndex(Math.min(index + 1, photos.length - 1)); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); onIndex(Math.max(index - 1, 0)); }
  }}>
    <div className="relative flex min-h-80 items-center justify-center overflow-hidden rounded-xl border border-velora-line bg-velora-sunken">
      {available ? <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={title} onError={() => setFailed(photo.id)} className="max-h-[65vh] min-h-80 w-full object-contain"/>
        <button className={`${buttonClass} absolute right-3 top-3`} onClick={() => { setExpanded(true); dialog.current?.showModal(); }}><Expand aria-hidden className="mr-2 inline h-4 w-4"/>Enlarge</button>
      </> : <div role="status" className="p-8 text-center text-sm text-velora-ink2"><p>{failed === photo.id ? 'Preview could not be loaded. Refresh your session or retry.' : 'Photo unavailable: removed, missing, or still processing.'}</p>{failed === photo.id && <button className={`${buttonClass} mt-3`} onClick={() => setFailed(null)}>Retry preview</button>}</div>}
    </div>
    <div className="mt-3 flex gap-2 overflow-x-auto pb-2" aria-label="Choose photo">{photos.map((item, position) => <button key={item.id} aria-label={`Photo ${position + 1}`} aria-pressed={position === index} className={`${buttonClass} min-w-24 shrink-0 text-left ${position === index ? 'border-velora-accent bg-velora-accent/10' : ''}`} onClick={() => onIndex(position)}><strong className="block">{position + 1}</strong><span className="text-[10px]">{item.moderation_status.replaceAll('_', ' ')}</span></button>)}</div>
    <div className="mt-2 flex items-center justify-between text-xs text-velora-ink2"><span>Photo {index + 1} of {photos.length}</span><div className="flex gap-2"><button aria-label="Previous photo" className={buttonClass} disabled={!index} onClick={() => onIndex(index - 1)}><ChevronLeft className="h-4 w-4"/></button><button aria-label="Next photo" className={buttonClass} disabled={index >= photos.length - 1} onClick={() => onIndex(index + 1)}><ChevronRight className="h-4 w-4"/></button></div></div>
    <p className="mt-3 text-xs text-velora-muted"><LockKeyhole aria-hidden className="mr-1 inline h-3 w-3"/>Private review · photo access logged · ← → to navigate</p>
    <dialog ref={dialog} aria-label={`Enlarged ${title}`} onClose={() => setExpanded(false)} className="max-h-[95vh] w-[min(96vw,1200px)] rounded-xl border border-velora-control bg-velora-surface p-4 text-velora-ink backdrop:bg-black/85"><div className="mb-3 flex items-center justify-between gap-3"><strong>{title}</strong><button autoFocus className={buttonClass} onClick={() => dialog.current?.close()}>Close photo</button></div>{expanded && available && <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={title} className="max-h-[80vh] w-full object-contain" onError={() => { setFailed(photo.id); dialog.current?.close(); }}/>
    </>}</dialog>
  </section>;
}
