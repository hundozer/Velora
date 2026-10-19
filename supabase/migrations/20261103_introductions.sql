-- People: Introductions and the activity-ordered index (editorial redesign, Phase 2).
-- show_in_introductions lets a member stay out of the five daily Introductions while
-- remaining findable in Everyone. Default true keeps today's behaviour; the member can
-- turn it off in Settings → Privacy. Only the server reads it (profiles has no anon grant).
-- The partial index serves the "Here now / Earlier today / This week" ordering, which only
-- ever considers members who chose to show their activity.
-- Additive and idempotent. The app keeps working before this is applied (it falls back
-- to including everyone eligible).
-- Rollback: drop index if exists public.profiles_activity_idx;
--   alter table public.profiles drop column if exists show_in_introductions;

alter table public.profiles add column if not exists show_in_introductions boolean not null default true;

create index if not exists profiles_activity_idx
  on public.profiles (last_active_at desc, id)
  where show_online_status = true and account_status = 'ACTIVE' and discovery_disabled = false;
