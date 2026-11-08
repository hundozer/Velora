-- Founding Members are exempt from the 3-in-3-month invitation quota.
-- All active members retain email-bound, 30-day, one-time invites and duplicate protection.
create or replace function public.claim_member_email_invite(p_inviter uuid, p_email_hash text, p_token_hash text)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid;
declare v_membership text;
begin
 if p_email_hash !~ '^[0-9a-f]{64}$' or p_token_hash !~ '^[0-9a-f]{64}$' then
   raise exception 'Invalid invitation input' using errcode='22023';
 end if;
 perform pg_advisory_xact_lock(hashtextextended(p_inviter::text,173));
 select membership_level into v_membership from public.profiles
    where id=p_inviter and account_status='ACTIVE'
      and coalesce(account_lifecycle_status,'ACTIVE')='ACTIVE';
 if not found then
   raise exception 'Active membership required' using errcode='42501';
 end if;
 if v_membership is distinct from 'FOUNDING_MEMBER' and
   (select count(*) from public.member_email_invites
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
revoke all on function public.claim_member_email_invite(uuid,text,text) from public, anon, authenticated;
grant execute on function public.claim_member_email_invite(uuid,text,text) to service_role;
