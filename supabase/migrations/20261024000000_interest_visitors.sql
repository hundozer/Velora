-- P1-08 Interest + Visitors. Feedback signals that bring members back.
-- profile_views: at most one row per viewer, viewed profile and day; never
--   written for members who browse invisibly or across a block (server-side).
-- interests: one-tap "interested" signal; mutual interest is both rows.
-- profiles.browse_invisibly: member choice, default off.
-- Additive and idempotent. Rollback: drop table public.profile_views;
--   drop table public.interests; alter table public.profiles drop column browse_invisibly;

create table if not exists public.profile_views (
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  viewed_id uuid not null references public.profiles(id) on delete cascade,
  viewed_on date not null default current_date,
  last_viewed_at timestamptz not null default now(),
  primary key (viewer_id, viewed_id, viewed_on),
  check (viewer_id <> viewed_id)
);
create index if not exists profile_views_viewed_idx on public.profile_views (viewed_id, last_viewed_at desc);

create table if not exists public.interests (
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_id, to_id),
  check (from_id <> to_id)
);
create index if not exists interests_to_idx on public.interests (to_id, created_at desc);

alter table public.profiles add column if not exists browse_invisibly boolean not null default false;

-- Server-written only. Members may read rows about themselves.
alter table public.profile_views enable row level security;
revoke all on public.profile_views from anon, authenticated;
grant select on public.profile_views to authenticated;
drop policy if exists profile_views_read_own on public.profile_views;
create policy profile_views_read_own on public.profile_views for select to authenticated using (viewed_id = auth.uid() or viewer_id = auth.uid());

alter table public.interests enable row level security;
revoke all on public.interests from anon, authenticated;
grant select on public.interests to authenticated;
drop policy if exists interests_read_own on public.interests;
create policy interests_read_own on public.interests for select to authenticated using (from_id = auth.uid() or to_id = auth.uid());
