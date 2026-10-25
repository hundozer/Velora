-- Blocking must atomically end all social relationships in both directions.
-- Rollback: drop function public.intimo_block_profile(uuid, uuid). Existing
-- blocks and removed connections are intentionally not reconstructed.
create or replace function public.intimo_block_profile(p_blocker_id uuid, p_blocked_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_block_id uuid;
begin
  if p_blocker_id is null or p_blocked_id is null or p_blocker_id = p_blocked_id then
    raise exception 'invalid block target';
  end if;

  insert into public.user_blocks (blocker_id, blocked_profile_id)
  values (p_blocker_id, p_blocked_id)
  on conflict (blocker_id, blocked_profile_id) do update
    set blocked_profile_id = excluded.blocked_profile_id
  returning id into v_block_id;

  delete from public.connections
  where (follower_id = p_blocker_id and followed_id = p_blocked_id)
     or (follower_id = p_blocked_id and followed_id = p_blocker_id);

  return v_block_id;
end;
$$;

revoke all on function public.intimo_block_profile(uuid, uuid) from public, anon, authenticated;
grant execute on function public.intimo_block_profile(uuid, uuid) to service_role;
