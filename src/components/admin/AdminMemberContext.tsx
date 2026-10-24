'use client';
import React from 'react';
import Link from 'next/link';
import { readable } from '@/lib/admin/workspace.mjs';
import type { WorkspaceActor } from './workspaceTypes';
export function AdminMemberContext({ id, actor }: { id?: string; actor: WorkspaceActor }) {
  const [data, setData] = React.useState<any>(null);
  const [error, setError] = React.useState('');
  const allowed = actor.permissions.includes('users:view_basic');
  React.useEffect(() => {
    if (!id || !allowed) return;
    const controller = new AbortController(); setData(null); setError('');
    fetch(`/api/admin/users/${id}`, { cache: 'no-store', signal: controller.signal }).then(async response => {
      const payload = await response.json(); if (!response.ok) throw Error(payload.error || 'Member context unavailable');
      if (!controller.signal.aborted) setData(payload);
    }).catch(cause => { if (!controller.signal.aborted) setError(cause.message); });
    return () => controller.abort();
  }, [id, allowed]);
  if (!id) return <p className="text-sm text-velora-muted">No member is linked to this record.</p>;
  if (!allowed) return <p className="text-sm text-velora-muted">Member history requires member-view permission.</p>;
  if (error) return <p role="alert" className="text-sm text-velora-danger">{error}</p>;
  if (!data) return <p className="text-sm text-velora-ink2">Loading member context…</p>;
  return <section className="space-y-3 border-b border-velora-line pb-5"><h3 className="font-semibold">{data.user.display_name || data.user.username || 'Member'}</h3><p className="text-xs text-velora-ink2">{readable(data.user.account_status)} · Joined {new Date(data.user.created_at).toLocaleDateString()}</p><Link href={`/admin/users?q=${id}`} className="inline-block text-sm text-velora-accent underline underline-offset-4">Open member record ↗</Link><details><summary className="cursor-pointer py-2 text-sm font-semibold">Account action history</summary><div className="space-y-3 pt-2">{data.actions.length ? data.actions.slice(0, 5).map((action: any) => <div key={action.id} className="text-xs"><strong>{readable(action.action)}</strong><p className="mt-1 text-velora-ink2">{action.reason}</p><time className="text-velora-muted">{new Date(action.created_at).toLocaleString()}</time></div>) : <p className="text-xs text-velora-ink2">No account actions in the returned history.</p>}</div></details></section>;
}
