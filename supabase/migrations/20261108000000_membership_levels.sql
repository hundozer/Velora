-- Recognition tiers are separate from staff roles and verification status.
alter table public.profiles
  add column if not exists membership_level text not null default 'MEMBER';
alter table public.profiles drop constraint if exists profiles_membership_level_check;
alter table public.profiles add constraint profiles_membership_level_check
  check (membership_level in ('MEMBER', 'FOUNDING_MEMBER', 'VIP'));
comment on column public.profiles.membership_level is
  'Community recognition only: never grants admin or other elevated permissions.';
