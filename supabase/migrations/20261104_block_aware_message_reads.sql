-- Tighten direct Supabase REST/Realtime reads, not just the application API.
-- Apply and verify on isolated staging first. No data or existing policy is removed.
-- Rollback: drop policy member_message_safety on public.direct_messages;
--           drop function public.intimo_can_read_message(uuid, uuid);
begin;

-- The definer reads both directions of a block: member_read_own_blocks exposes
-- only the viewer's outgoing blocks, so an invoker function would miss a peer's.
-- The function returns only a decision and always checks the authenticated uid;
-- callers cannot use arbitrary participant IDs to inspect other conversations.
create or replace function public.intimo_can_read_message(p_sender uuid, p_receiver uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and (select auth.uid()) in (p_sender, p_receiver)
    and exists (select 1 from public.profiles p where p.id = p_sender and p.account_status = 'ACTIVE')
    and exists (select 1 from public.profiles p where p.id = p_receiver and p.account_status = 'ACTIVE')
    and not exists (
      select 1 from public.user_blocks b
      where (b.blocker_id = p_sender and b.blocked_profile_id = p_receiver)
         or (b.blocker_id = p_receiver and b.blocked_profile_id = p_sender)
    );
$$;

revoke all on function public.intimo_can_read_message(uuid, uuid) from public, anon;
grant execute on function public.intimo_can_read_message(uuid, uuid) to authenticated;

-- Restrictive policies are ANDed with existing/future permissive policies.
-- Keep the existing owner-scoped read policy and client write revocations.
drop policy if exists member_message_safety on public.direct_messages;
create policy member_message_safety on public.direct_messages
  as restrictive for select to authenticated
  using (public.intimo_can_read_message(sender_id, receiver_id));

commit;
