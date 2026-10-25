-- Disposable empty PostgreSQL database only; never run this fixture in Supabase.
\set ON_ERROR_STOP on
create role anon nologin;
create role authenticated nologin;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
grant usage on schema auth to authenticated;
create table public.profiles (id uuid primary key, account_status text not null);
create table public.user_blocks (blocker_id uuid, blocked_profile_id uuid);
create table public.direct_messages (id integer primary key, sender_id uuid, receiver_id uuid, content text);
alter table public.profiles enable row level security;
alter table public.user_blocks enable row level security;
alter table public.direct_messages enable row level security;
alter table public.profiles force row level security;
alter table public.user_blocks force row level security;
alter table public.direct_messages force row level security;
grant select on public.profiles, public.user_blocks, public.direct_messages to authenticated;
create policy member_read_own_profile on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy member_read_own_blocks on public.user_blocks for select to authenticated using (blocker_id = (select auth.uid()));
create policy member_read_own_messages on public.direct_messages for select to authenticated using ((select auth.uid()) in (sender_id, receiver_id));
insert into public.profiles values
 ('00000000-0000-4000-8000-000000000001','ACTIVE'),
 ('00000000-0000-4000-8000-000000000002','ACTIVE'),
 ('00000000-0000-4000-8000-000000000003','ACTIVE');
insert into public.direct_messages values (1,'00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','private');
\ir ../../supabase/migrations/20261104000000_block_aware_message_reads.sql
-- Idempotent policy/function replacement.
\ir ../../supabase/migrations/20261104000000_block_aware_message_reads.sql

set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
do $$ begin
 if (select count(*) from public.direct_messages) <> 1 then raise exception 'A cannot read own message'; end if;
 if (select count(*) from public.profiles) <> 1 then raise exception 'fixture RLS not active'; end if;
 begin
   update public.direct_messages set content = 'tampered';
   raise exception 'member write unexpectedly allowed';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',false);
do $$ begin
 if (select count(*) from public.direct_messages) <> 0 then raise exception 'third party read'; end if;
 if public.intimo_can_read_message('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002') then raise exception 'helper exposes unrelated conversation'; end if;
end $$;
reset role;
-- B blocks A. A cannot SELECT B's block row, so a non-definer policy would fail.
insert into public.user_blocks values ('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001');
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
do $$ begin
 if (select count(*) from public.user_blocks) <> 0 then raise exception 'fixture should hide incoming blocks'; end if;
 if (select count(*) from public.direct_messages) <> 0 then raise exception 'blocked A can read'; end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
do $$ begin
 if (select count(*) from public.direct_messages) <> 0 then raise exception 'blocker B can read'; end if;
end $$;
reset role;
delete from public.user_blocks;
-- The other direction must also deny.
insert into public.user_blocks values ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002');
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
do $$ begin
 if (select count(*) from public.direct_messages) <> 0 then raise exception 'incoming block bypass'; end if;
end $$;
reset role;
delete from public.user_blocks;
update public.profiles set account_status = 'DEACTIVATED' where id = '00000000-0000-4000-8000-000000000001';
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false);
do $$ begin
 if (select count(*) from public.direct_messages) <> 0 then raise exception 'inactive peer bypass'; end if;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',false);
do $$ begin
 if (select count(*) from public.direct_messages) <> 0 then raise exception 'inactive viewer bypass'; end if;
end $$;
reset role;
set role anon;
do $$ begin
 begin
   perform * from public.direct_messages;
   raise exception 'anonymous read unexpectedly allowed';
 exception when insufficient_privilege then null; end;
 begin
   perform public.intimo_can_read_message('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002');
   raise exception 'anonymous helper execution unexpectedly allowed';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
\echo Message RLS assertions passed
