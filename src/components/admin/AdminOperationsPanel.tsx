'use client';
import React from 'react';
export function AdminOperationsPanel() {
  const [data, setData] = React.useState<any>(null); const [error, setError] = React.useState('');
  React.useEffect(() => { const controller = new AbortController(); fetch('/api/admin/operations', { cache: 'no-store', signal: controller.signal }).then(async response => { const body = await response.json(); if (!response.ok) throw Error(body.error || 'Operational checks unavailable'); if (!controller.signal.aborted) setData(body); }).catch(cause => { if (!controller.signal.aborted) setError(cause.message); }); return () => controller.abort(); }, []);
  if (error) return <p role="alert" className="text-velora-danger">{error}</p>;
  if (!data) return <p>Loading operational checks…</p>;
  return <section className="space-y-3"><h2 className="text-lg font-semibold">Needs intervention</h2>{data.checks.map((check: any) => <article key={check.label} className="flex items-start justify-between gap-5 rounded-xl border border-velora-line bg-velora-surface p-5"><div><h3 className="font-semibold">{check.label}</h3><p className="mt-1 max-w-2xl text-sm text-velora-ink2">{check.detail}</p></div><span className={`text-xl font-semibold ${check.count === null || check.count > 0 ? 'text-velora-warning' : 'text-velora-success'}`}>{check.count ?? 'Unavailable'}</span></article>)}<p className="text-xs text-velora-muted">Last checked {new Date(data.checkedAt).toLocaleString()}. An empty failure queue does not prove delivery or storage health.</p></section>;
}
