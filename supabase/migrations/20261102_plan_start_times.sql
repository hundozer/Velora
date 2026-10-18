-- Tonight: plans get an explicit start time (editorial redesign, Phase 1).
-- A plan now runs from starts_at until expires_at (its end). The app enforces that a
-- plan starts within the next 36 hours and lasts at most 12 hours; dating_ads is only
-- written by the server (no member or anon grants), so that rule lives in
-- src/lib/plans.mjs. The database guarantees the end is after the start.
-- Existing rows are backfilled with starts_at = created_at, which satisfies the check.
-- Additive and idempotent. The app keeps working before this is applied.
-- Rollback: alter table public.dating_ads drop constraint if exists dating_ads_plan_window_check;
--   drop index if exists public.dating_ads_live_start_idx;
--   alter table public.dating_ads drop column if exists starts_at;

alter table public.dating_ads add column if not exists starts_at timestamptz;
update public.dating_ads set starts_at = created_at where starts_at is null;
alter table public.dating_ads alter column starts_at set default now();
alter table public.dating_ads alter column starts_at set not null;

alter table public.dating_ads drop constraint if exists dating_ads_plan_window_check;
alter table public.dating_ads add constraint dating_ads_plan_window_check check (expires_at > starts_at);

create index if not exists dating_ads_live_start_idx on public.dating_ads (starts_at) where status = 'active';
