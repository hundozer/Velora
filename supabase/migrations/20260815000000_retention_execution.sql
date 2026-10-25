-- Scheduled privacy retention and deletion execution.
-- Apply after 20260814 in staging. The worker is inert unless the server-only
-- INTIMO_RETENTION_CRON_SECRET is configured and an authenticated scheduler calls it.
begin;
create table if not exists public.retention_holds (
  id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','RELEASED')), reason text not null,
  authority_reference text not null, created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), released_by uuid references public.profiles(id) on delete set null,
  released_at timestamptz, release_reason text
);
create index if not exists idx_retention_holds_profile_status on public.retention_holds(profile_id,status);
create table if not exists public.retention_runs (
  id uuid primary key default gen_random_uuid(), trigger_type text not null check (trigger_type in ('SCHEDULED','MANUAL')),
  status text not null check (status in ('RUNNING','COMPLETED','COMPLETED_WITH_ERRORS','FAILED')),
  started_at timestamptz not null default now(), completed_at timestamptz, processed_count integer not null default 0,
  completed_count integer not null default 0, failed_count integer not null default 0, skipped_count integer not null default 0,
  error_summary text
);
create table if not exists public.retention_execution_events (
  id uuid primary key default gen_random_uuid(), run_id uuid not null references public.retention_runs(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  outcome text not null check (outcome in ('COMPLETED','SKIPPED','FAILED')), detail text, created_at timestamptz not null default now()
);
create index if not exists idx_retention_execution_profile on public.retention_execution_events(profile_id,created_at desc);
alter table public.retention_holds enable row level security; alter table public.retention_holds force row level security;
alter table public.retention_runs enable row level security; alter table public.retention_runs force row level security;
alter table public.retention_execution_events enable row level security; alter table public.retention_execution_events force row level security;
revoke all on table public.retention_holds, public.retention_runs, public.retention_execution_events from anon, authenticated;
commit;
-- Rollback: disable the scheduler and preserve required deletion evidence, then
-- drop retention_execution_events, retention_runs and retention_holds.
