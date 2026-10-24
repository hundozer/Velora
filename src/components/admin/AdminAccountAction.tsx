'use client';

import Link from 'next/link';
import React from 'react';
import { buttonClass } from './workspaceTypes';

export function AdminAccountAction({ member, action, onCancel, onComplete }: {
  member: { id: string; display_name?: string; username?: string };
  action: string;
  onCancel: () => void;
  onComplete: () => void;
}) {
  const highRisk = ['SUSPEND', 'BAN', 'REACTIVATE'].includes(action);
  const expected = `CONFIRM ${action}`;
  const [reason, setReason] = React.useState('');
  const [category, setCategory] = React.useState('ACCOUNT_SAFETY');
  const [confirmation, setConfirmation] = React.useState('');
  const [error, setError] = React.useState('');
  const [reauthenticate, setReauthenticate] = React.useState(false);
  const [uncertain, setUncertain] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const ready = reason.trim().length >= 5 && category.trim().length >= 3 && (!highRisk || confirmation === expected);
  const returnTo = `/admin/users?q=${encodeURIComponent(member.id)}`;

  async function apply(event: React.FormEvent) {
    event.preventDefault();
    if (!ready || saving || uncertain || reauthenticate) return;
    setSaving(true); setError('');
    try {
      const response = await fetch(`/api/admin/users/${member.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: reason.trim(), category: category.trim(), confirmation: highRisk ? confirmation : undefined }),
      });
      const payload = await response.json();
      if (response.ok) { onComplete(); return; }
      if (payload.code === 'RECENT_AUTH_REQUIRED' || (response.status === 409 && !payload.code)) setReauthenticate(true);
      if (response.status >= 500) setUncertain(true);
      setError(payload.error || 'Account action failed.');
    } catch {
      setUncertain(true);
      setError('The result could not be confirmed. Refresh the member record and check its status and activity before trying again.');
    } finally { setSaving(false); }
  }

  return <form onSubmit={apply} className="rounded-xl border-2 border-velora-warning/40 bg-velora-warning/10 p-4">
    <h2 className="font-bold">{action.replaceAll('_', ' ')} {member.display_name || member.username || member.id}</h2>
    <p className="mt-1 text-sm text-velora-ink2">This changes the account&apos;s server-enforced status and creates an audit event.</p>
    <fieldset disabled={saving || uncertain || reauthenticate} className="mt-3 grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-semibold">Decision category<input required minLength={3} maxLength={100} value={category} onChange={event => setCategory(event.target.value)} className={`${buttonClass} mt-1 block w-full bg-velora-sunken`}/></label>
      <label className="text-sm font-semibold sm:col-span-2">Auditable reason<textarea required minLength={5} maxLength={1000} rows={3} value={reason} onChange={event => setReason(event.target.value)} className="mt-1 block w-full rounded-lg border border-velora-control bg-velora-sunken p-3 text-sm"/></label>
      {highRisk && <div className="space-y-3 sm:col-span-2">
        <p className="text-sm text-velora-ink2">This action requires a sign-in within the last 30 minutes. Verifying an authenticator code alone does not renew that sign-in.</p>
        <label className="block text-sm font-semibold">Type {expected} to confirm<input required value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" spellCheck={false} className={`${buttonClass} mt-1 block w-full bg-velora-sunken`} /></label>
      </div>}
    </fieldset>
    {error && <p role="alert" className="mt-3 text-sm text-velora-danger">{error}</p>}
    {highRisk && <p className="mt-3 text-sm"><Link href={`/login?returnTo=${encodeURIComponent(returnTo)}`} className="font-semibold text-velora-accent underline">Sign in again</Link><span className="text-velora-ink2">, complete MFA if prompted, then review and enter this decision again. No action is applied automatically.</span></p>}
    <div className="mt-4 flex flex-wrap gap-2">
      <button type="submit" disabled={!ready || saving || uncertain || reauthenticate} className={`${buttonClass} !bg-velora-danger font-bold text-velora-paper`}>{saving ? 'Saving…' : `Apply ${action.replaceAll('_', ' ').toLowerCase()}`}</button>
      {uncertain && <button type="button" onClick={onComplete} className={buttonClass}>Refresh member record</button>}
      <button type="button" disabled={saving} onClick={onCancel} className={buttonClass}>Cancel without changes</button>
    </div>
  </form>;
}
