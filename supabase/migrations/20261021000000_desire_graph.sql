-- P1-19 Desire Graph v1. Curated catalogue + per-member states.
-- Desires are special-category data (GDPR Art. 9): rows are written only by the
-- server after explicit SPECIAL_CATEGORY_DESIRES consent, and are deleted when
-- that consent is withdrawn or the profile is deleted (cascade).
-- Additive and idempotent. Rollback: drop table public.member_desires; drop table public.desires;
-- Seed must match src/lib/desires.mjs (enforced by tests/desire-graph.test.mjs).

create table if not exists public.desires (
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  category text not null check (category in ('connection', 'play', 'group', 'power', 'sensation', 'scene')),
  label text not null,
  sort_order integer not null default 0,
  active boolean not null default true
);

insert into public.desires (id, category, label, sort_order) values
  ('dating', 'connection', 'Dating', 10),
  ('fwb', 'connection', 'Friends with benefits', 20),
  ('casual', 'connection', 'Casual encounters', 30),
  ('flirting-chat', 'connection', 'Flirting & sexting', 40),
  ('slow-burn', 'connection', 'Slow burn', 50),
  ('kissing', 'play', 'Making out', 60),
  ('massage', 'play', 'Sensual massage', 70),
  ('oral', 'play', 'Oral', 80),
  ('toys', 'play', 'Toys', 90),
  ('roleplay', 'play', 'Roleplay', 100),
  ('photo-play', 'play', 'Photo & video play', 110),
  ('threesome', 'group', 'Threesomes', 120),
  ('swapping', 'group', 'Partner swapping', 130),
  ('soft-swap', 'group', 'Soft swap', 140),
  ('group-play', 'group', 'Group play', 150),
  ('cuckolding', 'group', 'Cuckolding / hotwifing', 160),
  ('unicorn', 'group', 'Joining a couple', 170),
  ('voyeurism', 'group', 'Watching', 180),
  ('exhibitionism', 'group', 'Being watched', 190),
  ('dominance', 'power', 'Dominance', 200),
  ('submission', 'power', 'Submission', 210),
  ('switch', 'power', 'Switching', 220),
  ('bondage', 'power', 'Bondage & rope', 230),
  ('praise', 'power', 'Praise', 240),
  ('degradation', 'power', 'Degradation', 250),
  ('fetish-wear', 'power', 'Latex, leather & fetish wear', 260),
  ('feet', 'power', 'Feet', 270),
  ('impact', 'sensation', 'Spanking & impact', 280),
  ('sensory', 'sensation', 'Blindfolds & sensory play', 290),
  ('rough', 'sensation', 'Rough play', 300),
  ('tantra', 'sensation', 'Tantra & slow sex', 310),
  ('clubs', 'scene', 'Swingers clubs', 320),
  ('kink-parties', 'scene', 'Kink & fetish parties', 330),
  ('munches', 'scene', 'Munches & meetups', 340),
  ('workshops', 'scene', 'Workshops', 350),
  ('saunas', 'scene', 'Saunas & naturism', 360)
on conflict (id) do update set
  category = excluded.category, label = excluded.label, sort_order = excluded.sort_order, active = true;

create table if not exists public.member_desires (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  desire_id text not null references public.desires(id) on update cascade on delete cascade,
  state text not null check (state in ('LOVE', 'INTO', 'CURIOUS', 'NOT_FOR_ME', 'HARD_LIMIT')),
  visibility text not null default 'MEMBERS' check (visibility in ('MEMBERS', 'PRIVATE')),
  updated_at timestamptz not null default now(),
  primary key (profile_id, desire_id),
  check (state <> 'NOT_FOR_ME' or visibility = 'PRIVATE')
);
create index if not exists member_desires_lookup_idx on public.member_desires (desire_id, state) where visibility = 'MEMBERS';

-- Catalogue: readable by signed-in members only. No member writes anywhere.
alter table public.desires enable row level security;
revoke all on public.desires from anon, authenticated;
grant select on public.desires to authenticated;
drop policy if exists desires_member_read on public.desires;
create policy desires_member_read on public.desires for select to authenticated using (active);

-- Selections: a member may read only their own rows directly; other members'
-- visible desires are served by the server after block/visibility checks.
alter table public.member_desires enable row level security;
revoke all on public.member_desires from anon, authenticated;
grant select on public.member_desires to authenticated;
drop policy if exists member_desires_read_own on public.member_desires;
create policy member_desires_read_own on public.member_desires for select to authenticated using (profile_id = auth.uid());
