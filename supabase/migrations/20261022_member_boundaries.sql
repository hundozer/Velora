-- P1-20 Boundaries & approach preferences, plus messaging defaults that made
-- every member unreachable.
-- 1. member_boundaries: one row per non-default preference; no row = default
--    (defaults live in src/lib/boundaries.mjs). Server-written only.
-- 2. profiles.allow_direct_messages defaulted to false and nothing ever set it
--    to true, so no member could receive a message. Default it to true and
--    switch it on for active, non-deleting accounts (account deletion still
--    sets it to false).
-- 3. profiles.require_verification_to_message defaulted to true while no
--    member is verified, so nobody could start a conversation. It is replaced
--    by the opt-in FIRST_MESSAGE_UNVERIFIED boundary; default it to false.
-- Additive (no columns dropped). Rollback: drop table public.member_boundaries;
--   alter table public.profiles alter column allow_direct_messages set default false,
--   alter column require_verification_to_message set default true;

create table if not exists public.member_boundaries (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('FIRST_MESSAGE_MEN', 'FIRST_MESSAGE_WOMEN', 'FIRST_MESSAGE_COUPLES', 'FIRST_MESSAGE_OTHER', 'FIRST_MESSAGE_UNVERIFIED', 'EXPLICIT_MEDIA_IN_CHAT', 'PRIVATE_ALBUM_REQUESTS', 'MEET_SAME_DAY', 'EXPLICIT_CHAT')),
  preference text not null check (preference in ('COMFORTABLE', 'ASK_FIRST', 'NOT_INTERESTED')),
  updated_at timestamptz not null default now(),
  primary key (profile_id, kind)
);

alter table public.member_boundaries enable row level security;
revoke all on public.member_boundaries from anon, authenticated;
grant select on public.member_boundaries to authenticated;
drop policy if exists member_boundaries_read_own on public.member_boundaries;
create policy member_boundaries_read_own on public.member_boundaries for select to authenticated using (profile_id = auth.uid());

alter table public.profiles alter column allow_direct_messages set default true;
update public.profiles set allow_direct_messages = true
  where allow_direct_messages = false and account_status = 'ACTIVE' and deletion_requested_at is null;

alter table public.profiles alter column require_verification_to_message set default false;
update public.profiles set require_verification_to_message = false
  where require_verification_to_message = true;
