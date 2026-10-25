-- Empty disposable PostgreSQL only. Never run this bootstrap on Supabase.
\set ON_ERROR_STOP on
do $$ begin
 if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
 if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
 if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
end $$;
alter default privileges in schema public grant all on tables to service_role;
create table public.profiles(id uuid primary key,auth_id text,email text,display_name text,account_status text,age_verification_status text,profile_visibility text,discovery_disabled boolean);
create table public.user_blocks(blocker_id uuid,blocked_profile_id uuid);
create table public.friendships(requester_id uuid,addressee_id uuid,status text);
create table public.media_objects(id uuid primary key,owner_id uuid references public.profiles(id),object_key text,media_type text,mime_type text,byte_size integer,visibility text,upload_status text,processing_status text,moderation_status text,content_rating text,category text,description text);
alter table public.media_objects add column created_at timestamptz not null default now();
create table public.retention_holds(profile_id uuid,status text);
\ir ../../supabase/migrations/20261025034408_private_photo_stories.sql
\ir ../../supabase/migrations/20261025042415_story_author_adult_guard.sql
\ir /tmp/intimo-story-cleanup-core.sql
create table public.dating_ads(id uuid primary key,author_id uuid references public.profiles(id),author_name text,category text,title text,text text,starts_at timestamptz,expires_at timestamptz,status text,moderation_status text,validity_days integer);
\ir ../../supabase/migrations/20261025062004_story_plan_invitations.sql
\ir stories-staging.sql
\ir story-plan-staging.sql
