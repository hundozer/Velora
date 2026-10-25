\set ON_ERROR_STOP on
do $$ begin
 if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
 if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
 if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
end $$;
create table public.profiles(id uuid primary key,auth_id text,account_status text,age_verification_status text,discovery_disabled boolean not null default false);
create table public.areas(id text primary key);
create table public.user_blocks(blocker_id uuid,blocked_profile_id uuid);
grant select on public.profiles,public.areas,public.user_blocks to service_role;
\ir ../../supabase/migrations/20261025114006_guest_list_pilot.sql
begin;
insert into public.profiles values
('78100500-0000-4000-8000-000000000001','host','ACTIVE','AGE_DECLARED'),
('78100500-0000-4000-8000-000000000002','guest1','ACTIVE','AGE_DECLARED'),
('78100500-0000-4000-8000-000000000003','guest2','ACTIVE','AGE_DECLARED'),
('78100500-0000-4000-8000-000000000004','guest3','ACTIVE','AGE_DECLARED');
insert into public.areas values('praha-2');
set local role service_role;
do $test$
declare h uuid:='78100500-0000-4000-8000-000000000001'; a uuid:='78100500-0000-4000-8000-000000000002'; b uuid:='78100500-0000-4000-8000-000000000003'; c uuid:='78100500-0000-4000-8000-000000000004'; n uuid:=gen_random_uuid(); x uuid:=gen_random_uuid(); y uuid:=gen_random_uuid(); z uuid:=gen_random_uuid();
begin
 insert into public.guest_nights(id,host_id,title,description,area_id,starts_at,ends_at,capacity,exact_address) values(n,h,'Small Prague night','Synthetic rollback-only hosted night','praha-2',now()+interval '1 day',now()+interval '1 day 3 hours',2,'Synthetic street 10');
 if public.intimo_guest_request(h,n,'Host cannot request their own gathering') is not null then raise exception 'Host self-request'; end if;
 x:=public.intimo_guest_request(a,n,'Synthetic guest one private introduction');
 if x is null then raise exception 'First request failed'; end if;
 if public.intimo_guest_request(a,n,'Synthetic guest one private introduction') is not null then raise exception 'Duplicate request'; end if;
 insert into public.guest_requests(id,night_id,applicant_id,pitch) values
 (y,n,b,'Synthetic guest two private introduction'),(z,n,c,'Synthetic guest three private introduction');
 -- A rejected or blocked request cannot be accepted even if inserted by a service operator.
 if public.intimo_guest_decide(a,x,true) then raise exception 'Applicant accepted self'; end if;
 if not public.intimo_guest_decide(h,x,true) then raise exception 'First acceptance failed'; end if;
 if public.intimo_guest_decide(h,x,true) then raise exception 'Double acceptance'; end if;
 insert into public.user_blocks values(b,h);
 if public.intimo_guest_decide(h,y,true) then raise exception 'Blocked guest accepted'; end if;
 delete from public.user_blocks where blocker_id=b;
 if not public.intimo_guest_decide(h,y,true) then raise exception 'Second acceptance failed'; end if;
 if public.intimo_guest_decide(h,z,true) then raise exception 'Capacity bypass'; end if;
 delete from public.guest_requests where id=y;
 if not public.intimo_guest_decide(h,z,false) then raise exception 'Decline failed'; end if;
 if (select status from public.guest_requests where id=z)<>'DECLINED' then raise exception 'Decision lost'; end if;
 if has_table_privilege('anon','public.guest_nights','SELECT') or has_table_privilege('authenticated','public.guest_nights','SELECT')
 or has_table_privilege('authenticated','public.guest_requests','INSERT')
 or has_function_privilege('authenticated','public.intimo_guest_decide(uuid,uuid,boolean)','EXECUTE')
 or has_function_privilege('authenticated','public.intimo_guest_request(uuid,uuid,text)','EXECUTE') then raise exception 'Direct member/anon access'; end if;
end $test$;
reset role;
rollback;
select 'PASS guest owner, block, capacity, state and direct role guards; fixtures rolled back' as result;
