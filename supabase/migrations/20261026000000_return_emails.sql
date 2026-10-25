-- P1-11 Return triggers. Email decisions happen when the event happens (no
-- cron): one email per member and category per 3 hours, only when the member
-- is not active, and never for a category they opted out of.
-- Additive and idempotent. Rollback: drop table public.email_send_state;
--   alter table public.profiles drop column email_opt_out;

alter table public.profiles add column if not exists email_opt_out text[] not null default '{}';

create table if not exists public.email_send_state (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('MESSAGE', 'INTEREST', 'PRIVATE_ACCESS', 'PLAN_REPLY')),
  last_sent_at timestamptz not null default now(),
  primary key (profile_id, category)
);

alter table public.email_send_state enable row level security;
revoke all on public.email_send_state from anon, authenticated;
