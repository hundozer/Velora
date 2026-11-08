-- Founder invites: private delivery audit, no raw invitee email addresses stored.
create table if not exists public.member_email_invites (
  id uuid primary key default gen_random_uuid(),
  inviter_profile_id uuid not null references public.profiles(id) on delete cascade,
  recipient_sha256 text not null check (recipient_sha256 ~ '^[0-9a-f]{64}$'),
  status text not null default 'PENDING' check (status in ('PENDING','SENT','FAILED')),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists member_email_invites_inviter_recent
  on public.member_email_invites(inviter_profile_id, created_at desc);
create index if not exists member_email_invites_hash_recent
  on public.member_email_invites(recipient_sha256, created_at desc);
alter table public.member_email_invites enable row level security;
alter table public.member_email_invites force row level security;
revoke all on table public.member_email_invites from public, anon, authenticated;
grant select, insert, update on table public.member_email_invites to service_role;

-- Serialize each founder's claims so parallel requests cannot bypass the limit.
create or replace function public.claim_founder_email_invite(p_inviter uuid, p_email_hash text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_id uuid;
begin
  if p_email_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid invite destination' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_inviter::text, 173));
  if not exists (
    select 1 from public.profiles
    where id = p_inviter and membership_level = 'FOUNDING_MEMBER'
      and account_status = 'ACTIVE'
      and coalesce(account_lifecycle_status, 'ACTIVE') = 'ACTIVE'
  ) then
    raise exception 'Founding Member access required' using errcode = '42501';
  end if;
  if (select count(*) from public.member_email_invites
        where inviter_profile_id = p_inviter
          and status in ('PENDING', 'SENT')
          and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'Daily invitation limit reached' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.member_email_invites
    where recipient_sha256 = p_email_hash
      and status in ('PENDING','SENT')
      and created_at > now() - interval '30 days'
  ) then
    raise exception 'This address has received a recent invitation' using errcode = '23505';
  end if;
  insert into public.member_email_invites(inviter_profile_id, recipient_sha256)
    values (p_inviter,p_email_hash) returning id into v_id;
  return v_id;
end
$$;
revoke all on function public.claim_founder_email_invite(uuid,text) from public, anon, authenticated;
grant execute on function public.claim_founder_email_invite(uuid,text) to service_role;
