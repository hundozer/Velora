-- P1-21 Prague Scene v0. Admin-curated listings of real sex-positive events,
-- each linking out to the organiser. Members may suggest listings; nothing is
-- shown until an admin publishes it. Past events drop off by query (ends_at or
-- starts_at in the past).
-- Additive and idempotent. Rollback: drop table public.scene_events;

create table if not exists public.scene_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text not null check (kind in ('MUNCH', 'WORKSHOP', 'PARTY', 'CLUB_NIGHT', 'MEETUP', 'OTHER')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  venue_name text,
  area_id text references public.areas(id) on update cascade on delete set null,
  organiser text not null,
  description text,
  url text not null check (url like 'https://%'),
  status text not null default 'PENDING_REVIEW' check (status in ('PENDING_REVIEW', 'PUBLISHED', 'REJECTED')),
  submitted_by uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);
create index if not exists scene_events_upcoming_idx on public.scene_events (starts_at) where status = 'PUBLISHED';

-- Server-mediated only.
alter table public.scene_events enable row level security;
revoke all on public.scene_events from anon, authenticated;
