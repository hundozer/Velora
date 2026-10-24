-- Empty disposable PostgreSQL only. Never execute this bootstrap on Supabase.
\set ON_ERROR_STOP on
do $$ begin
 if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
 if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
end $$;
create role service_role nologin bypassrls;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth to authenticated,service_role;
alter default privileges in schema public grant all on tables to service_role;
create table public.profiles(id uuid primary key,auth_id text,email text,display_name text not null default 'Synthetic',avatar_url text,account_status text not null default 'ACTIVE',is_demo boolean not null default false,last_active_at timestamptz);
create table public.user_blocks(id uuid primary key default gen_random_uuid(),blocker_id uuid,blocked_profile_id uuid);
create table public.direct_messages(id uuid primary key default gen_random_uuid(),conversation_id text,sender_id uuid,receiver_id uuid,sender_name text,content text,plan_id uuid,is_opened boolean default false,status text default 'SENT');
create table public.notifications(id uuid primary key default gen_random_uuid(),user_id uuid references public.profiles(id),type text,title text,message text,actor_name text,actor_avatar text,target_link text,is_read boolean default false,created_at timestamptz default now());
\ir ../../supabase/migrations/20261024_interest_visitors.sql
\ir ../../supabase/migrations/20261025_private_access.sql
-- Generated from the actual original migration by the CI command. Scheduler
-- extensions are Supabase-specific and are not altered by the new migration.
\ir /tmp/intimo-unread-core.sql
\ir ../../supabase/migrations/20261024153700_durable_interest_access_alerts.sql
\ir social-return-email-staging.sql
create table public.areas(id text primary key);
create table public.dating_ads(id uuid primary key default gen_random_uuid(),author_id uuid references public.profiles(id),author_name text,category text,title text,text text,validity_days integer,status text default 'active',moderation_status text default 'PENDING_REVIEW',starts_at timestamptz,expires_at timestamptz,area_id text);
alter table public.dating_ads enable row level security;
revoke all on public.dating_ads from anon,authenticated;
\ir ../../supabase/migrations/20261027_scene_events.sql
\ir ../../supabase/migrations/20261024202832_scene_company_plans.sql
\ir scene-company-staging.sql
