'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Inbox, Users, CalendarDays, Shield, History, Settings, KeyRound, Search, ArrowUpRight } from 'lucide-react';
import type { WorkspaceActor } from './workspaceTypes';
const nav = [
  { href: '/admin', label: 'Work inbox', icon: Inbox, permission: 'dashboard:view' },
  { href: '/admin/users', label: 'Members', icon: Users, permission: 'users:view_basic' },
  { href: '/admin/plans', label: 'Community', icon: CalendarDays, permission: 'content:moderate' },
  { href: '/admin/privacy', label: 'Privacy', icon: Shield, permission: 'privacy:view' },
  { href: '/admin/audit', label: 'Activity', icon: History, permission: 'audit:view' },
] as const;
export function AdminWorkspaceShell({ actor, title, children }: { actor: WorkspaceActor; title?: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const inbox = ['/admin', '/admin/content', '/admin/reports', '/admin/moderation', '/admin/verification'].includes(pathname);
  return <div className="min-h-screen bg-velora-sunken text-velora-ink">
    <header className="sticky top-0 z-40 border-b border-velora-line bg-velora-night px-4 py-3 text-velora-ink sm:px-6"><div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-4"><Link href="/admin" className="shrink-0 text-2xl font-bold tracking-tight">intimo<span className="text-velora-accent">↗</span></Link><span className="border-l border-velora-line pl-4 text-sm text-velora-ink2">Operations</span>{actor.permissions.includes('users:view_basic') && <form action="/admin/users" className="order-3 flex w-full items-center gap-2 rounded-lg border border-velora-control bg-velora-surface px-3 sm:order-none sm:ml-6 sm:max-w-lg sm:flex-1"><Search className="h-4 w-4 shrink-0 text-velora-muted" aria-hidden/><label className="sr-only" htmlFor="workspace-search">Search members</label><input id="workspace-search" name="q" placeholder="Search members by name, email or ID…" className="min-h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"/><button className="text-xs font-semibold text-velora-accent">Search</button></form>}<Link href="/admin/profile" className="ml-auto flex min-h-11 items-center gap-2 text-xs"><span className="hidden rounded-full border border-velora-success/30 bg-velora-success/10 px-3 py-1 text-velora-success sm:inline">{actor.mfaAuthenticated ? 'MFA verified' : 'MFA required'}</span><span className="flex h-9 w-9 items-center justify-center rounded-full border border-velora-control bg-velora-surface font-bold" aria-label={actor.email}>{actor.email.slice(0, 1).toUpperCase()}</span></Link></div></header>
    <div className="mx-auto grid max-w-[1800px] lg:grid-cols-[190px_minmax(0,1fr)]">
      <nav aria-label="Admin" className="flex flex-col border-b border-velora-line bg-velora-surface p-3 lg:sticky lg:top-[83px] lg:h-[calc(100vh-83px)] lg:border-b-0 lg:border-r"><ul className="grid grid-cols-5 gap-1 lg:grid-cols-1">{nav.filter(item => actor.permissions.includes(item.permission)).map(item => { const Icon = item.icon; const active = item.href === '/admin' ? inbox : item.href === '/admin/plans' ? pathname.startsWith('/admin/plans') || pathname.startsWith('/admin/scene') || pathname.startsWith('/admin/guest-list') : pathname.startsWith(item.href); return <li key={item.href}><Link href={item.href} aria-current={active ? 'page' : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-semibold sm:flex-row sm:gap-3 sm:px-3 sm:text-sm lg:justify-start ${active ? 'bg-velora-accent text-velora-paper' : 'text-velora-ink2 hover:bg-velora-sunken'}`}><Icon aria-hidden className="h-4 w-4"/>{item.label}</Link></li>; })}</ul><div className="mt-4 flex flex-wrap gap-1 border-t border-velora-line pt-3 lg:mt-auto lg:flex-col">{actor.permissions.includes('settings:view') && <Link href="/admin/settings" className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-velora-ink2"><Settings aria-hidden className="h-4 w-4"/>Settings</Link>}{actor.role === 'SUPER_ADMIN' && <Link href="/admin/god/admins" className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-velora-ink2"><KeyRound aria-hidden className="h-4 w-4"/>Team & access</Link>}<Link href="/" className="flex min-h-11 items-center gap-2 px-3 text-xs text-velora-accent">Back to Intimo<ArrowUpRight aria-hidden className="h-3 w-3"/></Link></div></nav>
      <main className="min-w-0 p-4 sm:p-6">{title && <div className="mb-6"><h1 className="text-3xl font-bold tracking-tight">{title}</h1></div>}{children}</main>
    </div>
  </div>;
}
