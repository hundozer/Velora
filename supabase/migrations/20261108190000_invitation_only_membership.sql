-- Invitation-only membership: three invitations per rolling three calendar months.
-- Existing members are grandfathered; only new profile creation requires a redeemed invitation.
alter table public.member_email_invites
  add column if not exists token_sha256 text unique,
  add column if not exists expires_at timestamptz,
  add column if not exists redeemed_at timestamptz,
  add column if not exists redeemed_auth_id uuid;
alter table public.member_email_invites drop constraint if exists member_email_invites_status_check;
alter table public.member_email_invites add constraint member_email_invites_status_check
  check (status in ('PENDING','SENT','FAILED','REDEEMED'));
create index if not exists member_invites_token_idx on public.member_email_invites(token_sha256)
  where token_sha256 is not null;

-- Deprecated privileged RPC must not be usable to circumvent the new limit.
revoke execute on function public.claim_founder_email_invite(uuid,text) from service_role;

create or replace function public.claim_member_email_invite(p_inviter uuid, p_email_hash text, p_token_hash text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid;
begin
 if p_email_hash !~ '^[0-9a-f]{64}$' or p_token_hash !~ '^[0-9a-f]{64}$' then
   raise exception 'Invalid invitation input' using errcode='22023';
 end if;
 perform pg_advisory_xact_lock(hashtextextended(p_inviter::text,173));
 if not exists(select 1 from public.profiles
    where id=p_inviter and account_status='ACTIVE'
    and coalesce(account_lifecycle_status,'ACTIVE')='ACTIVE') then
   raise exception 'Active membership required' using errcode='42501';
 end if;
 if (select count(*) from public.member_email_invites
    where inviter_profile_id=p_inviter and status in ('PENDING','SENT','REDEEMED')
    and created_at > now() - interval '3 months') >= 3 then
   raise exception 'Invitation allowance exhausted' using errcode='P0001';
 end if;
 if exists(select 1 from public.member_email_invites
    where recipient_sha256=p_email_hash and status in ('PENDING','SENT','REDEEMED')
    and created_at > now() - interval '30 days') then
   raise exception 'This address has received a recent invitation' using errcode='23505';
 end if;
 insert into public.member_email_invites(inviter_profile_id,recipient_sha256,token_sha256,expires_at)
 values(p_inviter,p_email_hash,p_token_hash,now()+interval '30 days') returning id into v_id;
 return v_id;
end $$;

create or replace function public.is_member_invite_valid(p_token_hash text,p_email_hash text)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
 select exists(select 1 from public.member_email_invites
   where token_sha256=p_token_hash and recipient_sha256=p_email_hash
   and status='SENT' and expires_at>now());
$$;

-- One-time redemption is serialized per invitation; bound to verified account email.
create or replace function public.redeem_member_invite(p_token_hash text,p_email_hash text,p_auth_id uuid)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid;
begin
 if p_token_hash !~ '^[0-9a-f]{64}$' or p_email_hash !~ '^[0-9a-f]{64}$' then return false; end if;
 update public.member_email_invites
 set status='REDEEMED',redeemed_at=now(),redeemed_auth_id=p_auth_id
 where token_sha256=p_token_hash and recipient_sha256=p_email_hash
   and status='SENT' and expires_at>now()
 returning id into v_id;
 return v_id is not null;
end $$;

revoke all on function public.claim_member_email_invite(uuid,text,text) from public, anon, authenticated;
revoke all on function public.is_member_invite_valid(text,text) from public, anon, authenticated;
revoke all on function public.redeem_member_invite(text,text,uuid) from public, anon, authenticated;
grant execute on function public.claim_member_email_invite(uuid,text,text) to service_role;
grant execute on function public.is_member_invite_valid(text,text) to service_role;
grant execute on function public.redeem_member_invite(text,text,uuid) to service_role;
