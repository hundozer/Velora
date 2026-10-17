-- Mutual, explicitly accepted friendships replace the undefined MATCHING_USERS audience.
-- FORWARD: apply after 20260818_transactional_blocking.sql.
-- ROLLBACK: change FRIENDS_ONLY values to PRIVATE, restore the former profile
-- constraints if required, then drop intimo_friend_action and friendships.

begin;

alter table public.profiles
  drop constraint if exists profiles_sensitive_fields_visibility_check,
  drop constraint if exists profiles_profile_visibility_check,
  drop constraint if exists profiles_message_permission_check;

update public.profiles set profile_visibility = 'FRIENDS_ONLY' where profile_visibility = 'MATCHING_USERS';
update public.profiles set sensitive_fields_visibility = 'FRIENDS_ONLY' where sensitive_fields_visibility = 'MATCHING_USERS';
update public.profiles set message_permission = 'FRIENDS_ONLY' where message_permission = 'MATCHING_USERS';

alter table public.profiles
  add constraint profiles_sensitive_fields_visibility_check check
    (sensitive_fields_visibility in ('EVERYONE','MEMBERS_ONLY','FRIENDS_ONLY','APPROVED_USERS','PRIVATE')),
  add constraint profiles_profile_visibility_check check
    (profile_visibility in ('EVERYONE','MEMBERS_ONLY','FRIENDS_ONLY','APPROVED_USERS','PRIVATE')),
  add constraint profiles_message_permission_check check
    (message_permission in ('EVERYONE','MEMBERS_ONLY','FRIENDS_ONLY','VERIFIED_ONLY','PRIVATE'));

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'PENDING' check (status in ('PENDING','ACCEPTED')),
  requested_at timestamptz not null default now(),
  accepted_at timestamptz,
  updated_at timestamptz not null default now(),
  check (requester_id <> addressee_id)
);
create unique index if not exists friendships_unordered_pair_unique
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index if not exists friendships_requester_idx on public.friendships(requester_id, status);
create index if not exists friendships_addressee_idx on public.friendships(addressee_id, status);
alter table public.friendships enable row level security;
alter table public.friendships force row level security;
revoke all on table public.friendships from public, anon, authenticated;

create or replace function public.intimo_friend_action(p_actor_id uuid, p_target_id uuid, p_action text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_friendship public.friendships%rowtype;
begin
  if p_actor_id is null or p_target_id is null or p_actor_id = p_target_id then
    raise exception 'invalid friendship target';
  end if;
  if exists (
    select 1 from public.user_blocks
    where (blocker_id = p_actor_id and blocked_profile_id = p_target_id)
       or (blocker_id = p_target_id and blocked_profile_id = p_actor_id)
  ) then raise exception 'friendship unavailable'; end if;

  select * into v_friendship from public.friendships
  where (requester_id = p_actor_id and addressee_id = p_target_id)
     or (requester_id = p_target_id and addressee_id = p_actor_id)
  for update;

  if p_action = 'REQUEST' then
    if v_friendship.id is null then
      insert into public.friendships(requester_id, addressee_id)
      values (p_actor_id, p_target_id);
      return 'OUTGOING';
    end if;
    if v_friendship.status = 'PENDING' and v_friendship.addressee_id = p_actor_id then
      update public.friendships set status='ACCEPTED', accepted_at=now(), updated_at=now() where id=v_friendship.id;
      return 'FRIENDS';
    end if;
  elsif p_action = 'ACCEPT' and v_friendship.status = 'PENDING' and v_friendship.addressee_id = p_actor_id then
    update public.friendships set status='ACCEPTED', accepted_at=now(), updated_at=now() where id=v_friendship.id;
    return 'FRIENDS';
  elsif p_action = 'DECLINE' and v_friendship.status = 'PENDING' and v_friendship.addressee_id = p_actor_id then
    delete from public.friendships where id=v_friendship.id;
    return 'NONE';
  elsif p_action = 'REMOVE' and v_friendship.id is not null then
    delete from public.friendships where id=v_friendship.id;
    return 'NONE';
  end if;
  raise exception 'invalid friendship transition';
end;
$$;
revoke all on function public.intimo_friend_action(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.intimo_friend_action(uuid, uuid, text) to service_role;

create or replace function public.intimo_block_profile(p_blocker_id uuid, p_blocked_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_block_id uuid;
begin
  if p_blocker_id is null or p_blocked_id is null or p_blocker_id = p_blocked_id then raise exception 'invalid block target'; end if;
  insert into public.user_blocks(blocker_id,blocked_profile_id) values(p_blocker_id,p_blocked_id)
  on conflict(blocker_id,blocked_profile_id) do update set blocked_profile_id=excluded.blocked_profile_id returning id into v_block_id;
  delete from public.connections where (follower_id=p_blocker_id and followed_id=p_blocked_id) or (follower_id=p_blocked_id and followed_id=p_blocker_id);
  delete from public.friendships where (requester_id=p_blocker_id and addressee_id=p_blocked_id) or (requester_id=p_blocked_id and addressee_id=p_blocker_id);
  return v_block_id;
end; $$;
revoke all on function public.intimo_block_profile(uuid, uuid) from public, anon, authenticated;
grant execute on function public.intimo_block_profile(uuid, uuid) to service_role;

commit;
