-- Replace the initial daily allowance with unlimited lifetime invitations.
-- A short-term pacing safeguard prevents automated bursts.
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
        and created_at > now() - interval '1 minute') >= 3 then
    raise exception 'Invitation pacing safeguard' using errcode = 'P0001';
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
