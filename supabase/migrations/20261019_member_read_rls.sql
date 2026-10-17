-- Issue #15: owner-scoped READ access for signed-in members, keyed by auth.uid().
-- profiles.id = auth.users.id (enforced since 20261018), so ownership is a direct match.
-- Writes stay server-side (field allowlists, eligibility rules, audit). The anon role
-- gets nothing. This also lets Supabase Realtime deliver direct_messages and
-- notifications to their participants only.
begin;

-- Grant SELECT only; RLS policies below restrict rows.
grant select on public.profiles, public.direct_messages, public.notifications, public.saved_items,
  public.user_blocks, public.media_objects, public.user_consents, public.privacy_requests
  to authenticated;

drop policy if exists member_read_own_profile on public.profiles;
create policy member_read_own_profile on public.profiles
  for select to authenticated using (id = (select auth.uid()));

drop policy if exists member_read_own_messages on public.direct_messages;
create policy member_read_own_messages on public.direct_messages
  for select to authenticated using ((select auth.uid()) in (sender_id, receiver_id));

drop policy if exists member_read_own_notifications on public.notifications;
create policy member_read_own_notifications on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists member_read_own_saved_items on public.saved_items;
create policy member_read_own_saved_items on public.saved_items
  for select to authenticated using (profile_id = (select auth.uid()));

drop policy if exists member_read_own_blocks on public.user_blocks;
create policy member_read_own_blocks on public.user_blocks
  for select to authenticated using (blocker_id = (select auth.uid()));

drop policy if exists member_read_own_media on public.media_objects;
create policy member_read_own_media on public.media_objects
  for select to authenticated using (owner_id = (select auth.uid()));

drop policy if exists member_read_own_consents on public.user_consents;
create policy member_read_own_consents on public.user_consents
  for select to authenticated using (profile_id = (select auth.uid()));

drop policy if exists member_read_own_privacy_requests on public.privacy_requests;
create policy member_read_own_privacy_requests on public.privacy_requests
  for select to authenticated using (profile_id = (select auth.uid()));

-- Realtime: stream new messages and notifications (RLS-filtered per subscriber).
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'direct_messages') then
      alter publication supabase_realtime add table public.direct_messages;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications') then
      alter publication supabase_realtime add table public.notifications;
    end if;
  end if;
end $$;

commit;
