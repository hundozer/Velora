-- Intimo Auth0 server-boundary lockdown
-- Date: 2026-08-07
--
-- DO NOT APPLY until every affected browser Supabase call has been moved behind
-- an Auth0-authenticated Next.js API using SUPABASE_SERVICE_ROLE_KEY.
-- Auth0 subjects are not Supabase auth.uid() values, so native user RLS policies
-- would not establish the intended ownership boundary in the current architecture.

begin;

-- Remove the legacy MVP policies that expose all rows to the public anon key.
drop policy if exists "Allow all select on profiles" on public.profiles;
drop policy if exists "Allow all insert on profiles" on public.profiles;
drop policy if exists "Allow all update on profiles" on public.profiles;

drop policy if exists "Allow all select on dating_ads" on public.dating_ads;
drop policy if exists "Allow all insert on dating_ads" on public.dating_ads;
drop policy if exists "Allow all update on dating_ads" on public.dating_ads;
drop policy if exists "Allow all delete on dating_ads" on public.dating_ads;

drop policy if exists "Allow all select on photo_albums" on public.photo_albums;
drop policy if exists "Allow all insert on photo_albums" on public.photo_albums;
drop policy if exists "Allow all update on photo_albums" on public.photo_albums;
drop policy if exists "Allow all delete on photo_albums" on public.photo_albums;

drop policy if exists "Allow all select on videos" on public.videos;
drop policy if exists "Allow all insert on videos" on public.videos;
drop policy if exists "Allow all update on videos" on public.videos;
drop policy if exists "Allow all delete on videos" on public.videos;

drop policy if exists "Allow all select on chat_messages" on public.chat_messages;
drop policy if exists "Allow all insert on chat_messages" on public.chat_messages;

drop policy if exists "Allow all select on connections" on public.connections;
drop policy if exists "Allow all insert on connections" on public.connections;
drop policy if exists "Allow all delete on connections" on public.connections;

drop policy if exists "Allow all select on notifications" on public.notifications;
drop policy if exists "Allow all insert on notifications" on public.notifications;
drop policy if exists "Allow all update on notifications" on public.notifications;

drop policy if exists "Allow all select on direct_messages" on public.direct_messages;
drop policy if exists "Allow all insert on direct_messages" on public.direct_messages;

-- Defense in depth: neither the public anon role nor a Supabase-authenticated
-- browser role may access these tables directly. The service_role bypasses RLS
-- and remains restricted to server-only environment variables.
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.dating_ads from anon, authenticated;
revoke all on table public.photo_albums from anon, authenticated;
revoke all on table public.videos from anon, authenticated;
revoke all on table public.chat_messages from anon, authenticated;
revoke all on table public.connections from anon, authenticated;
revoke all on table public.notifications from anon, authenticated;
revoke all on table public.direct_messages from anon, authenticated;

alter table public.profiles force row level security;
alter table public.dating_ads force row level security;
alter table public.photo_albums force row level security;
alter table public.videos force row level security;
alter table public.chat_messages force row level security;
alter table public.connections force row level security;
alter table public.notifications force row level security;
alter table public.direct_messages force row level security;

commit;

-- Rollback procedure (emergency only): restore grants only after installing
-- explicit owner/participant policies. Never recreate USING(true) or
-- WITH CHECK(true) policies. A rollback that restores public access is unsafe.
