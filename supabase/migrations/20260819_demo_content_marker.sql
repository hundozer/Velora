-- Marks synthetic records without changing normal profile behavior.
-- This migration does not create demo content. The separate staging seed is opt-in.
-- ROLLBACK: drop index idx_profiles_is_demo, then drop profiles.is_demo.
begin;

alter table public.profiles
  add column if not exists is_demo boolean not null default false;

create index if not exists idx_profiles_is_demo
  on public.profiles(is_demo)
  where is_demo = true;

commit;
