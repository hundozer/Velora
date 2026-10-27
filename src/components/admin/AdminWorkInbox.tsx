'use client';
import React from 'react';
import Link from 'next/link';
import { Inbox, Flag, Image, FileCheck2, Search, RefreshCw, ArrowLeft, AlertCircle } from 'lucide-react';
import { sources, normalizeWork, sortWork, readable, waiting, photoReady, albumReady } from '@/lib/admin/workspace.mjs';
import { AdminReviewGallery } from './AdminReviewGallery';
import { AdminMemberContext } from './AdminMemberContext';
import { buttonClass, type WorkspaceActor, type WorkItem, type ReviewPhoto } from './workspaceTypes';

export function AdminWorkInbox({ actor, initialFilter = 'all' }: { actor: WorkspaceActor; initialFilter?: string }) {
  const permissions = actor.permissions;
  const [items, setItems] = React.useState<WorkItem[]>([]);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [limited, setLimited] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [revision, setRevision] = React.useState(0);
  const [filter, setFilter] = React.useState(initialFilter);
  const [query, setQuery] = React.useState('');
  const [mine, setMine] = React.useState(false);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState('');
  React.useEffect(() => {
    const controller = new AbortController(); setLoading(true);
    const allowed = sources.filter(source => permissions.includes(source.permission as typeof permissions[number]));
    Promise.all(allowed.map(async source => {
      try {
        const response = await fetch(source.path, { cache: 'no-store', signal: controller.signal });
        const payload = await response.json(); if (!response.ok) throw Error(payload.error || `${source.label} unavailable`);
        const rows = payload[source.field] || [];
        return { items: normalizeWork(source.kind, rows), error: '', limit: rows.length >= source.limit ? source.label : '' };
      } catch (cause) { return { items: [], error: cause instanceof Error ? cause.message : `${source.label} unavailable`, limit: '' }; }
    })).then(results => {
      if (controller.signal.aborted) return;
      setItems(sortWork(results.flatMap(result => result.items))); setErrors(results.map(result => result.error).filter(Boolean));
      setLimited(results.map(result => result.limit).filter(Boolean)); setLoading(false);
    });
    return () => controller.abort();
  }, [permissions, revision]);
  const visible = items.filter(item => (filter === 'all' || (filter === 'content' ? ['album', 'photo'].includes(item.kind) : item.kind === filter)) && (!mine || item.assignedTo === actor.profileId) && `${item.title} ${item.id} ${item.ownerId || ''} ${item.row.reason || ''}`.toLowerCase().includes(query.toLowerCase()));
  const active = visible.find(item => item.key === selected);
  const urgent = items.filter(item => item.urgent).length;
  const tabs = [{ id: 'all', label: 'All' }, { id: 'report', label: 'Reports' }, { id: 'content', label: 'Media & albums' }, { id: 'verification', label: 'Verification' }];
  return <div>
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-bold tracking-tight">Work inbox</h1><p className="mt-2 text-sm text-velora-ink2">Review the evidence. Make the call.</p></div><button className={buttonClass} disabled={loading} onClick={() => setRevision(value => value + 1)}><RefreshCw aria-hidden className="mr-2 inline h-4 w-4"/>Refresh</button></div>
    {notice && <p role="status" className="mb-4 rounded-lg border border-velora-accent/40 bg-velora-accent/10 p-3 text-sm">{notice}</p>}
    {errors.length > 0 && <div role="alert" className="mb-4 rounded-lg border border-velora-warning/40 p-3 text-sm text-velora-warning"><strong>Some queues could not be loaded.</strong>{errors.map(error => <p key={error}>{error}</p>)}<p>Counts include successfully loaded records only.</p></div>}
    {limited.length > 0 && <p className="mb-3 text-xs text-velora-warning">Queue limits reached: {limited.join(', ')}. Counts describe this loaded window, not the entire backlog.</p>}
    <div className="mb-4 flex flex-wrap items-center gap-2" aria-label="Filter work inbox">{tabs.map(tab => <button key={tab.id} aria-pressed={filter === tab.id} className={`${buttonClass} ${filter === tab.id ? 'border-velora-accent !bg-velora-accent text-velora-paper' : ''}`} onClick={() => { setFilter(tab.id); setSelected(null); }}>{tab.label} <span className="ml-1 opacity-70">{items.filter(item => tab.id === 'all' || (tab.id === 'content' ? ['album', 'photo'].includes(item.kind) : item.kind === tab.id)).length}</span></button>)}<label className="ml-auto flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={mine} onChange={event => { setMine(event.target.checked); setSelected(null); }}/>Assigned to me</label></div>
    {mine && <p className="mb-3 text-xs text-velora-muted">Assigned report and verification records only. Photos and albums do not currently have assignees.</p>}
    <div className="grid items-start gap-4 xl:grid-cols-[230px_minmax(0,1fr)] 2xl:grid-cols-[270px_minmax(0,1fr)]">
      <section aria-label="Waiting work" className={`${active ? 'hidden xl:block' : ''} min-w-0 rounded-xl border border-velora-line bg-velora-surface`}>
        <label className="m-3 flex items-center gap-2 rounded-lg border border-velora-control px-3"><Search aria-hidden className="h-4 w-4 shrink-0 text-velora-muted"/><span className="sr-only">Search this queue</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search this queue…" className="min-h-11 min-w-0 w-full bg-transparent text-sm outline-none"/></label>
        {urgent > 0 && <button className="mx-3 mb-3 flex w-[calc(100%-24px)] items-center gap-2 rounded-lg border border-velora-warning/40 bg-velora-warning/10 p-3 text-left text-xs font-semibold text-velora-warning" onClick={() => { setFilter('report'); setMine(false); setQuery(''); setSelected(null); }}><AlertCircle aria-hidden className="h-4 w-4 shrink-0"/>{urgent} urgent {urgent === 1 ? 'report needs' : 'reports need'} attention</button>}
        {loading ? <p role="status" className="p-5 text-sm">Loading work…</p> : visible.length ? <ol className="max-h-[65vh] overflow-y-auto xl:max-h-[calc(100vh-350px)]">{visible.map(item => {
          const Icon = item.kind === 'report' ? Flag : item.kind === 'verification' ? FileCheck2 : Image;
          return <li key={item.key}><button aria-pressed={selected === item.key} className={`flex w-full gap-3 border-t border-velora-line p-4 text-left hover:bg-velora-accent/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-velora-accent ${selected === item.key ? 'bg-velora-accent/10' : ''}`} onClick={() => setSelected(item.key)}><span className="rounded-lg border border-velora-line p-2 text-velora-accent"><Icon aria-hidden className="h-5 w-5"/></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.title}</strong><span className="mt-1 block text-xs text-velora-ink2">{item.row.media_type === 'VIDEO' ? 'Video' : readable(item.kind)} · {waiting(item.createdAt)}</span>{item.urgent && <span className="mt-1 block text-xs font-semibold text-velora-warning">Urgent</span>}{item.assignedTo === actor.profileId && <span className="mt-1 block text-xs text-velora-accent">Assigned to you</span>}</span></button></li>;
        })}</ol> : <p className="p-5 text-sm text-velora-ink2">{errors.length ? 'No matching work in the queues that loaded.' : 'No work matches these filters.'}</p>}
        <p className="border-t border-velora-line p-3 text-xs text-velora-muted">{visible.length} loaded items · urgency, then oldest first</p>
      </section>
      {active ? <div className="min-w-0"><button className={`${buttonClass} mb-3 xl:hidden`} onClick={() => setSelected(null)}><ArrowLeft aria-hidden className="mr-2 inline h-4 w-4"/>Back to queue</button><ReviewDesk key={`${active.key}:${revision}`} item={active} actor={actor} onSaved={message => { setNotice(message); setRevision(value => value + 1); }}/></div> : <section className="flex min-h-[440px] flex-col items-center justify-center rounded-xl border border-dashed border-velora-control p-8 text-center"><Inbox aria-hidden className="mb-4 h-9 w-9 text-velora-accent"/><h2 className="text-lg font-semibold">Choose an item to review</h2><p className="mt-2 max-w-sm text-sm text-velora-ink2">Evidence, member context and decisions stay together. Photos are revealed when you open a review.</p><p className="mt-5 max-w-md text-xs leading-5 text-velora-muted">Consensual adult expression is not a violation by itself. Apply the community guidelines to consent, age, harassment and authenticity.</p></section>}
    </div>
  </div>;
}

function ReviewDesk({ item, actor, onSaved }: { item: WorkItem; actor: WorkspaceActor; onSaved: (message: string) => void }) {
  const [photos, setPhotos] = React.useState<ReviewPhoto[]>(item.kind === 'photo' ? [item.row as ReviewPhoto] : []);
  const [index, setIndex] = React.useState(0);
  const [photoError, setPhotoError] = React.useState('');
  const [photoLoading, setPhotoLoading] = React.useState(item.kind === 'album');
  const [policy, setPolicy] = React.useState(''); const [reason, setReason] = React.useState('');
  const [notify, setNotify] = React.useState(false); const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(''); const [more, setMore] = React.useState(false);
  const [confirmation, setConfirmation] = React.useState('');
  const [uncertain, setUncertain] = React.useState(false);
  const content = ['album', 'photo'].includes(item.kind);
  const reveal = actor.permissions.includes('content:reveal_sensitive');
  const canDecide = actor.permissions.includes(content ? 'content:moderate' : item.kind === 'report' ? 'moderation:decide' : 'verification:decide') && (!item.urgent || actor.permissions.includes('moderation:critical'));
  React.useEffect(() => {
    if (item.kind !== 'album' || !reveal) { setPhotoLoading(false); return; }
    const controller = new AbortController();
    fetch(`/api/admin/albums/${item.id}/photos`, { cache: 'no-store', signal: controller.signal }).then(async response => {
      const payload = await response.json(); if (!response.ok) throw Error(payload.error || 'Photos unavailable');
      if (!controller.signal.aborted) setPhotos(payload.photos || []);
    }).catch(cause => { if (!controller.signal.aborted) setPhotoError(cause.message); }).finally(() => { if (!controller.signal.aborted) setPhotoLoading(false); });
    return () => controller.abort();
  }, [item.id, item.kind, reveal]);
  const photo = photos[index]; const allApproved = albumReady(photos);
  const valid = Boolean(policy && reason.trim().length >= 10);
  async function decide(decision: string, photoOnly = false) {
    if (saving) return;
    if (!valid) { setError('Choose a policy reason and add at least 10 characters describing the evidence.'); return; }
    if (['REJECTED', 'REMOVED'].includes(decision) && confirmation !== `CONFIRM ${decision}`) { setError(`Type CONFIRM ${decision} before applying this action.`); setMore(true); return; }
    setSaving(true); setError('');
    const endpoint = content ? photoOnly || item.kind === 'photo' ? '/api/admin/media' : '/api/admin/albums' : item.kind === 'report' ? '/api/admin/moderation' : '/api/admin/verification';
    const note = `${policy}: ${reason.trim()}`;
    const body = content ? { id: photoOnly ? photo.id : item.id, decision: decision === 'REQUEST_CHANGES' ? 'REJECTED' : decision, requestChanges: decision === 'REQUEST_CHANGES', notifyMember: notify, reason: note, confirmation: `CONFIRM ${decision === 'REQUEST_CHANGES' ? 'REJECTED' : decision}` }
      : item.kind === 'report' ? { id: item.id, status: decision, decision, decisionReason: note } : { id: item.id, status: decision, reason: note };
    try {
      const response = await fetch(endpoint, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const payload = await response.json(); if (!response.ok) throw Error(payload.error || 'Decision failed');
      onSaved(payload.notificationWarning || (photoOnly ? 'Photo approved. Review remaining photos before approving the album.' : decision === 'REQUEST_CHANGES' ? 'Changes requested. Content stays unpublished until edited and resubmitted.' : 'Decision recorded.'));
    } catch (cause) { setUncertain(true); setError(`${cause instanceof Error ? cause.message : 'Decision failed'}. Refresh the queue before retrying; the decision may already have been saved.`); }
    finally { setSaving(false); }
  }
  return <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_280px] 2xl:grid-cols-[minmax(0,1fr)_310px]">
    <section aria-label="Review evidence" className="min-w-0 rounded-xl border border-velora-line bg-velora-surface p-4 sm:p-5"><p className="text-xs text-velora-muted">{content ? 'Photos & albums' : readable(item.kind)} / Review</p><h2 className="mt-3 break-words text-2xl font-semibold">{item.title}</h2><p className="mt-2 text-sm text-velora-ink2">{readable(item.row.moderation_status || item.row.status)}{item.row.visibility ? ` · ${readable(item.row.visibility)}` : ''}</p><p className="mb-5 mt-1 text-xs text-velora-muted">Submitted {new Date(item.createdAt).toLocaleString()}</p>
      {content ? !reveal ? <p className="rounded-lg border p-5 text-sm">Sensitive-content permission is required to view photos.</p> : photoLoading ? <p role="status">Loading album photos…</p> : photoError ? <p role="alert" className="text-sm text-velora-danger">{photoError}</p> : <AdminReviewGallery photos={photos} index={index} onIndex={setIndex}/> : <div className="space-y-4 rounded-lg border border-velora-line p-5"><h3 className="font-semibold">{readable(item.row.reason || item.row.verification_type || item.row.content_type)}</h3><p className="whitespace-pre-wrap break-words text-sm leading-6 text-velora-ink2">{item.row.description || item.row.reason || 'No additional description was supplied.'}</p>{item.row.content_type === 'MESSAGE' && <p className="text-sm text-velora-warning">Private conversations are not available in this inbox. Use the controlled case-evidence process.</p>}{item.kind === 'verification' && item.row.verification_type === 'IDENTITY' && item.row.provider_reference && <a href={`/api/admin/verification/${item.id}/evidence`} target="_blank" rel="noreferrer" className={`${buttonClass} inline-block`}>Open private identity evidence ↗</a>}<p className="break-all font-mono text-xs text-velora-muted">Reference: {item.id}</p></div>}
      <details className="mt-5 border-t border-velora-line pt-4"><summary className="cursor-pointer text-sm font-semibold">Details & review note</summary><p className="mt-3 whitespace-pre-wrap text-sm text-velora-ink2">{item.row.description || 'No description supplied.'}</p>{item.row.moderator_note && <p className="mt-3 text-sm">Latest review note: {item.row.moderator_note}</p>}<p className="mt-3 break-all font-mono text-xs text-velora-muted">{item.id}</p>{actor.permissions.includes('audit:view') && <Link href="/admin/audit" className="mt-3 inline-block text-sm text-velora-accent underline">Open review activity</Link>}</details>
    </section>
    <aside aria-label="Review and decide" className="min-w-0 space-y-5 rounded-xl border border-velora-line bg-velora-surface p-5"><h2 className="text-lg font-bold">Review & decide</h2><AdminMemberContext id={item.ownerId} actor={actor}/>
      {content && <section className="space-y-2 text-sm"><h3 className="font-semibold">Checks</h3><p className="text-velora-ink2">{photos.length} {photos.length === 1 ? "photo" : "photos"} in this review</p><p className={allApproved ? 'text-velora-success' : 'text-velora-warning'}>{allApproved ? 'Every photo is ready and approved' : 'Every photo needs its own approval first'}</p><p className="text-xs text-velora-muted">Consensual adult content is not a violation by itself.</p></section>}
      {!canDecide ? <p className="rounded-lg border border-velora-warning/40 p-3 text-sm text-velora-warning">Your role cannot decide this record{item.urgent ? '. Urgent cases require critical-case permission' : ''}.</p> : <fieldset disabled={saving || uncertain} className="space-y-5">
        <label className="block text-sm font-semibold">Decision reason<select aria-label="Decision reason" value={policy} onChange={event => setPolicy(event.target.value)} className={`${buttonClass} mt-2 w-full font-normal`}><option value="">Choose policy reason</option>{['Consent or privacy', 'Suspected underage content', 'Harassment or threats', 'Impersonation or fraud', 'Photo quality or album details', 'Meets community guidelines', 'Other policy reason'].map(value => <option key={value}>{value}</option>)}</select></label>
        <label className="block text-sm font-semibold">Review note<textarea rows={4} maxLength={3500} value={reason} onChange={event => setReason(event.target.value)} placeholder="Describe the evidence and decision…" className="mt-2 w-full rounded-lg border border-velora-control bg-velora-sunken p-3 text-sm font-normal"/></label>
        {content && <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={notify} onChange={event => setNotify(event.target.checked)}/>Notify member in Intimo</label>}
        {error && <p role="alert" className="rounded-lg border border-velora-danger/40 p-3 text-sm text-velora-danger">{error}</p>}
        {content ? <div className="space-y-2">{item.kind === 'album' && photo && photo.moderation_status !== 'APPROVED' && <button className={`${buttonClass} w-full border-velora-accent text-velora-accent`} disabled={saving || !valid || !photoReady(photo)} onClick={() => decide('APPROVED', true)}>Approve photo {index + 1}</button>}<button className={`${buttonClass} w-full border-velora-accent !bg-velora-accent font-bold text-velora-paper`} disabled={saving || !valid || !reveal || (item.kind === 'album' ? !allApproved : !photoReady(photo))} onClick={() => decide('APPROVED')}>{item.kind === 'album' ? 'Approve album' : 'Approve photo'}</button>{item.kind === 'album' && !allApproved && <p className="text-xs leading-5 text-velora-muted">Approve each photo first. Public albums also require public photos.</p>}<button className={`${buttonClass} w-full`} disabled={saving || !valid} onClick={() => decide('REQUEST_CHANGES')}>Request changes</button><button className={`${buttonClass} w-full`} aria-expanded={more} onClick={() => setMore(value => !value)}>More actions…</button>{more && <div className="space-y-2 rounded-lg border border-velora-line p-3"><label className="block text-xs">For reject/remove, type CONFIRM REJECTED or CONFIRM REMOVED<input value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" className={`${buttonClass} mt-2 w-full`}/></label><div className="flex flex-wrap gap-2">{['UNDER_REVIEW', 'HIDDEN', 'REJECTED', 'REMOVED'].map(value => <button key={value} className={buttonClass} disabled={saving || !valid} onClick={() => decide(value)}>{readable(value)}</button>)}</div></div>}</div> : <div className="flex flex-col gap-2">{(item.kind === 'report' ? ['UNDER_REVIEW', 'ESCALATED', 'RESOLVED', 'REJECTED'] : ['VERIFIED', 'RETRY_REQUESTED', 'FAILED']).map(value => <button key={value} className={buttonClass} disabled={saving || !valid} onClick={() => decide(value)}>{value === 'UNDER_REVIEW' ? 'Take review / assign to me' : readable(value)}</button>)}</div>}
        <p className="text-xs leading-5 text-velora-muted">{saving ? 'Saving decision…' : 'Decision, reason and reviewer are recorded.'}</p>
      </fieldset>}
    </aside>
  </div>;
}
