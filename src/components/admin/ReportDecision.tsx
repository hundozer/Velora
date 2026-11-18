'use client';
import React from 'react';
import Link from 'next/link';
import { ACTIONS, DEFAULT_GROUND, POLICY_GROUNDS } from '@/lib/moderation/outcomes.mjs';
import { buttonClass, type WorkItem } from './workspaceTypes';

const field = 'mt-2 w-full rounded-lg border border-velora-control bg-velora-sunken p-3 text-sm font-normal';
const readable = (value: unknown) => String(value || '').toLowerCase().replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase());

/** FM-07: response-time target for a report, with overdue shown plainly. */
export function ReportTarget({ row }: { row: WorkItem['row'] }) {
  if (!row.due_at || ['RESOLVED', 'REJECTED', 'APPEALED'].includes(row.status)) return null;
  const due = new Date(row.due_at);
  return <p className={`rounded-lg border p-3 text-sm ${row.overdue ? 'border-velora-danger/50 font-semibold text-velora-danger' : 'border-velora-line text-velora-ink2'}`}>
    {row.overdue ? 'Overdue: ' : 'Decide by '}{due.toLocaleString()} <span className="text-xs">({row.priority === 'CRITICAL' ? '1-hour target' : '12-hour target'})</span>
  </p>;
}

async function send(url: string, body: unknown) {
  const response = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw Error(payload.error || 'Decision failed');
  return payload;
}

/**
 * FM-07: deciding a report. "Action taken" needs what was done, the guideline it relies on and
 * an explanation written for the reported member (sent to them as a statement of reasons).
 * "No breach" only tells the reporter. Both notify the reporter of the outcome.
 */
export function ReportDecision({ item, onSaved }: { item: WorkItem; onSaved: (message: string) => void }) {
  const row = item.row;
  const [mode, setMode] = React.useState<'breach' | 'none' | null>(null);
  const [action, setAction] = React.useState('WARNING');
  const [ground, setGround] = React.useState(DEFAULT_GROUND[row.reason] || 'OTHER');
  const [statement, setStatement] = React.useState('');
  const [note, setNote] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [uncertain, setUncertain] = React.useState(false);

  async function run(body: unknown, url = '/api/admin/moderation', done = 'Decision recorded. The reporter has been told the outcome.') {
    if (saving) return;
    setSaving(true); setError('');
    try { const payload = await send(url, body); onSaved(payload.notificationWarning || done); }
    catch (cause) { setUncertain(true); setError(`${cause instanceof Error ? cause.message : 'Decision failed'}. Refresh the queue before retrying; it may already be saved.`); }
    finally { setSaving(false); }
  }

  if (row.status === 'APPEALED' && row.appeal) return <AppealDecision item={item} onSaved={onSaved}/>;

  const noteValid = note.trim().length >= 10;
  const statementValid = statement.replace(/\s+/g, ' ').trim().length >= 20;
  return <fieldset disabled={saving || uncertain} className="space-y-4">
    <ReportTarget row={row}/>
    <div className="flex flex-wrap gap-2">
      {row.status !== 'UNDER_REVIEW' && <button className={buttonClass} onClick={() => run({ id: item.id, status: 'UNDER_REVIEW' }, undefined, 'Taken for review.')}>Take review</button>}
      {row.status !== 'ESCALATED' && <button className={buttonClass} onClick={() => run({ id: item.id, status: 'ESCALATED' }, undefined, 'Escalated.')}>Escalate</button>}
    </div>
    <div className="grid grid-cols-2 gap-2" role="group" aria-label="Outcome">
      <button aria-pressed={mode === 'breach'} className={`${buttonClass} ${mode === 'breach' ? 'border-velora-accent !bg-velora-accent text-velora-paper' : ''}`} onClick={() => setMode('breach')}>Breach: take action</button>
      <button aria-pressed={mode === 'none'} className={`${buttonClass} ${mode === 'none' ? 'border-velora-accent !bg-velora-accent text-velora-paper' : ''}`} onClick={() => setMode('none')}>No breach</button>
    </div>
    {mode === 'breach' && <>
      <label className="block text-sm font-semibold">What was done<select value={action} onChange={(event) => setAction(event.target.value)} className={field}>{Object.entries(ACTIONS).filter(([key]) => key !== 'NO_ACTION').map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <p className="text-xs text-velora-muted">Apply the action itself in <Link href="/admin/users" className="underline">Users</Link> or on the content. This records the decision and tells both members.</p>
      <label className="block text-sm font-semibold">Guideline it relies on<select value={ground} onChange={(event) => setGround(event.target.value)} className={field}>{Object.entries(POLICY_GROUNDS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="block text-sm font-semibold">Explanation for the reported member <span className="font-normal text-velora-muted">(they will read this)</span><textarea rows={4} maxLength={2000} value={statement} onChange={(event) => setStatement(event.target.value)} placeholder="What happened and why it breaks the guideline. Never name the reporter." className={field}/></label>
    </>}
    {mode && <label className="block text-sm font-semibold">Internal note <span className="font-normal text-velora-muted">(team only, at least 10 characters)</span><textarea rows={3} maxLength={3500} value={note} onChange={(event) => setNote(event.target.value)} placeholder="What did you check?" className={field}/></label>}
    {error && <p role="alert" className="rounded-lg border border-velora-danger/40 p-3 text-sm text-velora-danger">{error}</p>}
    {mode === 'breach' && <button className={`${buttonClass} w-full border-velora-accent !bg-velora-accent font-bold text-velora-paper`} disabled={!noteValid || !statementValid} onClick={() => run({ id: item.id, status: 'RESOLVED', decision: action, decisionReason: note.trim(), actionTaken: action, policyGround: ground, memberStatement: statement })}>Record decision and notify</button>}
    {mode === 'none' && <button className={`${buttonClass} w-full`} disabled={!noteValid} onClick={() => run({ id: item.id, status: 'REJECTED', decision: 'NO_ACTION', decisionReason: note.trim() })}>Close: no breach found</button>}
    <p className="text-xs leading-5 text-velora-muted">{saving ? 'Saving decision…' : 'The reported member is only told when action is taken. Nobody is told who reported.'}</p>
  </fieldset>;
}

function AppealDecision({ item, onSaved }: { item: WorkItem; onSaved: (message: string) => void }) {
  const row = item.row;
  const appeal = row.appeal as { reason: string; by: string; created_at: string };
  const [statement, setStatement] = React.useState('');
  const [note, setNote] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [uncertain, setUncertain] = React.useState(false);
  const valid = statement.replace(/\s+/g, ' ').trim().length >= 20 && note.trim().length >= 10;
  async function decide(outcome: string) {
    if (saving) return;
    setSaving(true); setError('');
    try {
      const payload = await send('/api/admin/moderation/appeals', { caseId: item.id, outcome, memberStatement: statement, internalReason: note.trim() });
      onSaved(payload.notificationWarning || (outcome === 'UPHELD' ? 'Appeal decided: decision upheld.' : 'Appeal decided. If an account action changes, apply it in Users.'));
    } catch (cause) { setUncertain(true); setError(`${cause instanceof Error ? cause.message : 'Decision failed'}. Refresh the queue before retrying.`); }
    finally { setSaving(false); }
  }
  return <fieldset disabled={saving || uncertain} className="space-y-4">
    <section className="space-y-2 rounded-lg border border-velora-accent/40 bg-velora-accent/10 p-4 text-sm">
      <p className="font-semibold">Appeal by the {appeal.by === 'REPORTER' ? 'person who reported' : 'reported member'}</p>
      <p className="whitespace-pre-wrap break-words">{appeal.reason}</p>
      <p className="text-xs text-velora-muted">Original decision: {ACTIONS[row.action_taken] || readable(row.action_taken || 'none recorded')}{row.policy_ground ? ` · ${POLICY_GROUNDS[row.policy_ground]}` : ''}</p>
      {row.member_statement && <p className="text-xs text-velora-ink2">Statement sent: {row.member_statement}</p>}
      {row.decision_reason && <p className="text-xs text-velora-ink2">Internal note: {row.decision_reason}</p>}
    </section>
    <p className="text-xs text-velora-muted">If you can, let someone other than the original reviewer decide the appeal.</p>
    <label className="block text-sm font-semibold">Explanation for the member who appealed<textarea rows={4} maxLength={2000} value={statement} onChange={(event) => setStatement(event.target.value)} className={field}/></label>
    <label className="block text-sm font-semibold">Internal note <span className="font-normal text-velora-muted">(team only)</span><textarea rows={3} maxLength={3500} value={note} onChange={(event) => setNote(event.target.value)} className={field}/></label>
    {error && <p role="alert" className="rounded-lg border border-velora-danger/40 p-3 text-sm text-velora-danger">{error}</p>}
    <div className="flex flex-col gap-2">{[['UPHELD', 'Uphold the decision'], ['PARTIALLY_OVERTURNED', 'Change part of it'], ['OVERTURNED', 'Reverse the decision']].map(([value, label]) => <button key={value} className={buttonClass} disabled={!valid} onClick={() => decide(value)}>{label}</button>)}</div>
  </fieldset>;
}
