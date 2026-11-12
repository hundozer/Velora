-- Public "request an invitation" form. Additive only: one new table and one function.
-- The raw address is kept only while a request is undecided, so the invitation can be
-- sent on approval; it is cleared once the request is decided. RLS is forced and only
-- the service role can read or write.
create table if not exists public.invitation_requests (
  id uuid primary key default gen_random_uuid(),
  email text check (email is null or char_length(email) <= 254),
  email_sha256 text not null check (email_sha256 ~ '^[0-9a-f]{64}$'),
  identity text not null check (identity in ('WOMAN','MAN','COUPLE','OTHER')),
  based_in text not null check (based_in in ('PRAGUE','CZECHIA','ABROAD')),
  intent text not null check (char_length(intent) between 10 and 500),
  language text not null default 'en' check (language in ('en','cs')),
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles(id) on delete set null,
  invite_id uuid references public.member_email_invites(id) on delete set null
);
-- One open request per address.
create unique index if not exists invitation_requests_one_pending
  on public.invitation_requests(email_sha256) where status = 'PENDING';
create index if not exists invitation_requests_recent
  on public.invitation_requests(status, created_at desc);
alter table public.invitation_requests enable row level security;
alter table public.invitation_requests force row level security;
revoke all on table public.invitation_requests from public, anon, authenticated;
grant select, insert, update on table public.invitation_requests to service_role;

-- Approve one pending request and create its single-use invitation in one transaction.
-- The approving admin is recorded as the inviter; the member allowance does not apply.
create or replace function public.approve_invitation_request(p_request uuid, p_admin uuid, p_token_hash text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_hash text; v_invite uuid;
begin
  if p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid invitation input' using errcode = '22023';
  end if;
  select email_sha256 into v_hash from public.invitation_requests
    where id = p_request and status = 'PENDING' and email is not null for update;
  if v_hash is null then
    raise exception 'Request is not pending' using errcode = 'P0002';
  end if;
  if exists (select 1 from public.member_email_invites
      where recipient_sha256 = v_hash and status in ('PENDING','SENT','REDEEMED')
      and created_at > now() - interval '30 days') then
    raise exception 'This address has received a recent invitation' using errcode = '23505';
  end if;
  insert into public.member_email_invites(inviter_profile_id, recipient_sha256, token_sha256, expires_at)
    values (p_admin, v_hash, p_token_hash, now() + interval '30 days') returning id into v_invite;
  update public.invitation_requests
    set status = 'APPROVED', decided_at = now(), decided_by = p_admin, invite_id = v_invite
    where id = p_request;
  return v_invite;
end $$;
revoke all on function public.approve_invitation_request(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.approve_invitation_request(uuid,uuid,text) to service_role;
