-- Member-to-member ads are longer-lived than Tonight invitations.
-- No anon/authenticated table grants: all access is server-mediated.
begin;
create table public.personal_ads (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('HOOKUP','FUCK_BUDDY','COUPLES','GROUP','KINK','ONLINE')),
  title text not null check (char_length(title) between 3 and 100),
  body text not null check (char_length(body) between 20 and 2000),
  boundaries text not null check (char_length(boundaries) between 3 and 500),
  area_id text references public.areas(id) on update cascade on delete set null,
  allowed_reply_genders jsonb not null default '[]'::jsonb,
  min_age integer not null default 18,
  max_age integer not null default 99,
  require_verified boolean not null default false,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','CLOSED')),
  moderation_status text not null default 'PENDING_REVIEW' check (moderation_status in ('PENDING_REVIEW','APPROVED','REJECTED')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint personal_ads_age_range check (min_age >= 18 and max_age <= 99 and min_age <= max_age),
  constraint personal_ads_expiry check (expires_at > created_at and expires_at <= created_at + interval '31 days')
);
create index personal_ads_live on public.personal_ads (created_at desc, id desc) where status = 'ACTIVE' and moderation_status = 'APPROVED';
create index personal_ads_author on public.personal_ads (author_id, created_at desc);
alter table public.personal_ads enable row level security;
alter table public.personal_ads force row level security;
revoke all on public.personal_ads from public, anon, authenticated;
grant select, insert, update, delete on public.personal_ads to service_role;
alter table public.direct_messages add column personal_ad_id uuid references public.personal_ads(id) on delete set null;
create index direct_messages_personal_ad on public.direct_messages(personal_ad_id) where personal_ad_id is not null;
commit;
