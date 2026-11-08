-- Web push (Phase 2): discreet device notifications for the same four return
-- categories as email. One row per browser/device push subscription.
-- Stores only what a push service needs to deliver: no names, no content.
-- Additive and idempotent. Rollback:
--   drop table if exists public.push_subscriptions;
--   alter table public.profiles drop column if exists push_opt_out;

alter table public.profiles add column if not exists push_opt_out text[] not null default '{}';

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique check (endpoint like 'https://%' and length(endpoint) <= 1000),
  p256dh text not null check (length(p256dh) between 40 and 200),
  auth text not null check (length(auth) between 8 and 100),
  locale text not null default 'en' check (locale in ('en', 'cs')),
  created_at timestamptz not null default now(),
  last_success_at timestamptz,
  failure_count integer not null default 0
);
create index if not exists push_subscriptions_profile on public.push_subscriptions(profile_id);

-- Server-only: members manage their devices through /api/push/subscription.
alter table public.push_subscriptions enable row level security;
alter table public.push_subscriptions force row level security;
revoke all on public.push_subscriptions from public, anon, authenticated;
grant select, insert, update, delete on public.push_subscriptions to service_role;
