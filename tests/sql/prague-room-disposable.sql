\set ON_ERROR_STOP on
do $$ begin
 if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
 if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
 if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
end $$;
create table public.profiles(id uuid primary key);
\ir ../../supabase/migrations/20261025182105_prague_room.sql
\ir ../../supabase/migrations/20261026071236_prague_room_presence.sql
begin;
insert into public.profiles values('78100500-0000-4000-8000-000000000001');
set local role service_role;
insert into public.room_messages(sender_id,body) values('78100500-0000-4000-8000-000000000001','Hello Prague');
insert into public.room_presence(profile_id) values('78100500-0000-4000-8000-000000000001');
do $$ begin
 if has_table_privilege('anon','public.room_messages','SELECT') or has_table_privilege('authenticated','public.room_messages','SELECT') or has_table_privilege('authenticated','public.room_messages','INSERT') or has_table_privilege('authenticated','public.room_messages','UPDATE') then raise exception 'direct room access'; end if;
 if has_table_privilege('anon','public.room_presence','SELECT') or has_table_privilege('authenticated','public.room_presence','SELECT') or has_table_privilege('authenticated','public.room_presence','INSERT') then raise exception 'direct presence access'; end if;
 if (select count(*) from public.room_messages where status='VISIBLE') <> 1 then raise exception 'service access'; end if;
 if (select count(*) from public.room_presence) <> 1 then raise exception 'service presence access'; end if;
end $$;
reset role;
rollback;
select 'PASS room role denial and service access; fixture rolled back' as result;
