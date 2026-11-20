-- Social V1C: Requests are not memberships. Only approved rows in room_members grant access.
-- Server-side service-role API is the sole entry point (no client grants).
begin;

create table public.room_join_requests (
  room_id text not null references public.rooms(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'DECLINED', 'CANCELLED')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles(id) on delete set null,
  primary key (room_id, requester_id),
  constraint room_join_decision_consistent check (
    (status = 'PENDING' and decided_at is null and decided_by is null)
    or (status = 'CANCELLED' and decided_at is not null and decided_by is null)
    or (status in ('APPROVED', 'DECLINED') and decided_at is not null and decided_by is not null)
  )
);
create index room_join_requests_pending on public.room_join_requests(room_id, requested_at)
  where status = 'PENDING';
alter table public.room_join_requests enable row level security;
revoke all on public.room_join_requests from public, anon, authenticated;
grant select, insert, update, delete on public.room_join_requests to service_role;

-- SECURITY INVOKER, restricted to server service_role. All transitions and membership
-- grants share a transaction and serialize on the room row to prevent double decisions.
create function public.intimo_room_join_action(
  p_room_id text, p_actor_id uuid, p_action text, p_requester_id uuid default null
) returns text
language plpgsql security invoker set search_path = ''
as $$
declare
  v_room public.rooms%rowtype;
  v_target uuid;
  v_existing public.room_join_requests%rowtype;
  v_has_request boolean := false;
  v_now timestamptz := now();
begin
  if p_action not in ('REQUEST','CANCEL','APPROVE','DECLINE') then
    raise exception 'Unsupported room request action';
  end if;

  select * into v_room from public.rooms where id = p_room_id for update;
  if not found or v_room.builtin or not v_room.locked
      or (v_room.expires_at is not null and v_room.expires_at <= v_now) then
    raise exception 'Locked room unavailable';
  end if;
  if not exists (
    select 1 from public.profiles p where p.id = p_actor_id and p.auth_id is not null
      and p.account_status = 'ACTIVE' and p.age_verification_status = 'AGE_VERIFIED'
      and p.is_demo = false
  ) then
    raise exception 'Active verified member required';
  end if;

  if p_action in ('REQUEST','CANCEL') then
    v_target := p_actor_id;
    if v_room.creator_id = p_actor_id then raise exception 'Owner is already admitted'; end if;
  else
    if v_room.creator_id <> p_actor_id then raise exception 'Owner required'; end if;
    v_target := p_requester_id;
  end if;
  if v_target is null then raise exception 'Invalid requester'; end if;

  if p_action in ('REQUEST','APPROVE') then
    if not exists (
      select 1 from public.profiles p where p.id = v_target
        and p.auth_id is not null and p.account_status = 'ACTIVE'
        and p.age_verification_status = 'AGE_VERIFIED' and p.is_demo = false
    ) then
      raise exception 'Requester unavailable';
    end if;
    if exists (
      select 1 from public.user_blocks b
      where (b.blocker_id = v_room.creator_id and b.blocked_profile_id = v_target)
        or (b.blocker_id = v_target and b.blocked_profile_id = v_room.creator_id)
    ) then
      raise exception 'Requester unavailable';
    end if;
  end if;

  select * into v_existing from public.room_join_requests
    where room_id = p_room_id and requester_id = v_target for update;
  v_has_request := found;

  if p_action = 'REQUEST' then
    if exists (select 1 from public.room_members
      where room_id = p_room_id and profile_id = v_target) then
      raise exception 'Already a member';
    end if;
    if v_has_request and v_existing.status = 'PENDING' then return 'PENDING'; end if;
    -- Declined members must be explicitly added by owner. Prevent repeated harassment.
    if v_has_request and v_existing.status = 'DECLINED' then raise exception 'Request declined'; end if;
    if v_has_request and v_existing.status = 'CANCELLED'
      and v_existing.decided_at > v_now - interval '24 hours' then
      raise exception 'Request recently cancelled';
    end if;
    insert into public.room_join_requests(room_id, requester_id, status, requested_at, decided_at, decided_by)
      values(p_room_id, v_target, 'PENDING', v_now, null, null)
      on conflict(room_id, requester_id) do update set
        status = 'PENDING', requested_at = excluded.requested_at,
        decided_at = null, decided_by = null;
    return 'PENDING';
  end if;

  if not v_has_request then raise exception 'Request unavailable'; end if;
  if p_action = 'CANCEL' then
    if v_existing.status <> 'PENDING' then raise exception 'Request is not pending'; end if;
    update public.room_join_requests set status='CANCELLED', decided_at=v_now, decided_by=null
      where room_id=p_room_id and requester_id=v_target;
    return 'CANCELLED';
  end if;
  if v_existing.status <> 'PENDING' then raise exception 'Request is not pending'; end if;

  if p_action = 'APPROVE' then
    insert into public.room_members(room_id,profile_id)
      values(p_room_id,v_target) on conflict do nothing;
    update public.room_join_requests
      set status='APPROVED', decided_at=v_now, decided_by=p_actor_id
      where room_id=p_room_id and requester_id=v_target;
    return 'APPROVED';
  end if;

  update public.room_join_requests
    set status='DECLINED', decided_at=v_now, decided_by=p_actor_id
    where room_id=p_room_id and requester_id=v_target;
  return 'DECLINED';
end;
$$;
revoke all on function public.intimo_room_join_action(text,uuid,text,uuid) from public, anon, authenticated;
grant execute on function public.intimo_room_join_action(text,uuid,text,uuid) to service_role;
commit;
