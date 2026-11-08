-- Single-use founder welcome delivery ledger. No recipient email stored here.
create table if not exists public.founding_member_welcome_deliveries (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  status text not null default 'PENDING' check (status in ('PENDING','SENT','FAILED')),
  requested_by uuid not null references public.profiles(id) on delete restrict,
  requested_at timestamptz not null default now(),
  sent_at timestamptz,
  provider_message_id text
);
alter table public.founding_member_welcome_deliveries enable row level security;
alter table public.founding_member_welcome_deliveries force row level security;
revoke all on public.founding_member_welcome_deliveries from public, anon, authenticated;
grant select, insert, update on public.founding_member_welcome_deliveries to service_role;
