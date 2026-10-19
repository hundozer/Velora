-- Actual recovered Intimo Staging only (fuczjjcwtxzzvoxilrme).
-- Run as the database owner via Supabase execute_sql. Creates no Auth users.
-- Uses real Supabase roles and auth.uid(), with simulated request claims.
-- This proves SQL/RLS behavior, not JWT validation, REST or Realtime delivery.
-- Every fixture and the deliberately permissive test policy are rolled back.
begin;
do $$ begin
  if to_regclass('intimo_migration_audit.legacy_profile_identity') is null
    or not exists(select 1 from pg_policies where schemaname='public' and tablename='direct_messages' and policyname='member_message_safety' and permissive='RESTRICTIVE')
  then raise exception 'Recovered staging with restrictive policy required'; end if;
  if exists(select 1 from public.profiles where id in ('b5415350-b51f-43ce-b039-47c297260001','b5415350-b51f-43ce-b039-47c297260002','b5415350-b51f-43ce-b039-47c297260003')) then raise exception 'Fixture ID collision'; end if;
end $$;
insert into public.profiles(id,auth_id,email,display_name,account_status) values
('b5415350-b51f-43ce-b039-47c297260001','b5415350-b51f-43ce-b039-47c297260001','rls-a-20261019@example.invalid','SQL fixture A','ACTIVE'),
('b5415350-b51f-43ce-b039-47c297260002','b5415350-b51f-43ce-b039-47c297260002','rls-b-20261019@example.invalid','SQL fixture B','ACTIVE'),
('b5415350-b51f-43ce-b039-47c297260003','b5415350-b51f-43ce-b039-47c297260003','rls-c-20261019@example.invalid','SQL fixture C','ACTIVE');
insert into public.direct_messages(id,conversation_id,sender_id,receiver_id,sender_name,content) values
('b5415350-b51f-43ce-b039-47c297260004','staging-rollback-20261019','b5415350-b51f-43ce-b039-47c297260001','b5415350-b51f-43ce-b039-47c297260002','SQL fixture A','rollback-only');
set local role authenticated;
select set_config('request.jwt.claim.sub','b5415350-b51f-43ce-b039-47c297260001',true);
do $$ begin
 if (select count(*) from public.direct_messages where id='b5415350-b51f-43ce-b039-47c297260004')<>1 then raise exception 'A own message denied'; end if;
 if (select count(*) from public.profiles)<>1 then raise exception 'Profile RLS not effective'; end if;
 begin
  update public.direct_messages set content='tampered' where id='b5415350-b51f-43ce-b039-47c297260004';
  raise exception 'Direct message write allowed';
 exception when insufficient_privilege then null; end;
 begin
  update public.profiles set account_status='ACTIVE';
  raise exception 'Direct profile write allowed';
 exception when insufficient_privilege then null; end;
 begin
  insert into public.member_desires(profile_id,desire_id,state) values('b5415350-b51f-43ce-b039-47c297260001','massage','INTO');
  raise exception 'Direct desire write allowed';
 exception when insufficient_privilege then null; end;
 begin
  perform public.intimo_block_profile('b5415350-b51f-43ce-b039-47c297260001','b5415350-b51f-43ce-b039-47c297260002');
  raise exception 'Privileged block RPC exposed';
 exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','b5415350-b51f-43ce-b039-47c297260002',true);
do $$ begin
 if (select count(*) from public.direct_messages where id='b5415350-b51f-43ce-b039-47c297260004')<>1 then raise exception 'B own message denied'; end if;
end $$;
select set_config('request.jwt.claim.sub','b5415350-b51f-43ce-b039-47c297260003',true);
do $$ begin
 if exists(select 1 from public.direct_messages where id='b5415350-b51f-43ce-b039-47c297260004') then raise exception 'Unrelated member message read'; end if;
 if public.intimo_can_read_message('b5415350-b51f-43ce-b039-47c297260001','b5415350-b51f-43ce-b039-47c297260002') then raise exception 'Unrelated helper call leaked access'; end if;
end $$;
reset role;
-- An accidentally broad permissive policy must not bypass the safety policy.
create policy staging_rollback_permissive_probe on public.direct_messages for select to authenticated using(true);
insert into public.user_blocks(blocker_id,blocked_profile_id) values('b5415350-b51f-43ce-b039-47c297260002','b5415350-b51f-43ce-b039-47c297260001');
set local role authenticated;
select set_config('request.jwt.claim.sub','b5415350-b51f-43ce-b039-47c297260001',true);
do $$ begin
 if exists(select 1 from public.user_blocks where blocker_id='b5415350-b51f-43ce-b039-47c297260002') then raise exception 'Incoming block should be hidden'; end if;
 if exists(select 1 from public.direct_messages where id='b5415350-b51f-43ce-b039-47c297260004') then raise exception 'A reads after incoming block'; end if;
end $$;
select set_config('request.jwt.claim.sub','b5415350-b51f-43ce-b039-47c297260002',true);
do $$ begin
 if exists(select 1 from public.direct_messages where id='b5415350-b51f-43ce-b039-47c297260004') then raise exception 'B reads after own block'; end if;
end $$;
reset role;
delete from public.user_blocks where blocker_id='b5415350-b51f-43ce-b039-47c297260002' and blocked_profile_id='b5415350-b51f-43ce-b039-47c297260001';
insert into public.user_blocks(blocker_id,blocked_profile_id) values('b5415350-b51f-43ce-b039-47c297260001','b5415350-b51f-43ce-b039-47c297260002');
set local role authenticated;
select set_config('request.jwt.claim.sub','b5415350-b51f-43ce-b039-47c297260002',true);
do $$ begin
 if exists(select 1 from public.direct_messages where id='b5415350-b51f-43ce-b039-47c297260004') then raise exception 'B reads after incoming block'; end if;
end $$;
select set_config('request.jwt.claim.sub','b5415350-b51f-43ce-b039-47c297260001',true);
do $$ begin
 if exists(select 1 from public.direct_messages where id='b5415350-b51f-43ce-b039-47c297260004') then raise exception 'A reads after own block'; end if;
end $$;
reset role;
delete from public.user_blocks where blocker_id='b5415350-b51f-43ce-b039-47c297260001' and blocked_profile_id='b5415350-b51f-43ce-b039-47c297260002';
update public.profiles set account_status='DEACTIVATED' where id='b5415350-b51f-43ce-b039-47c297260001';
set local role authenticated;
select set_config('request.jwt.claim.sub','b5415350-b51f-43ce-b039-47c297260001',true);
do $$ begin
 if exists(select 1 from public.direct_messages where id='b5415350-b51f-43ce-b039-47c297260004') then raise exception 'Inactive viewer read'; end if;
end $$;
select set_config('request.jwt.claim.sub','b5415350-b51f-43ce-b039-47c297260002',true);
do $$ begin
 if exists(select 1 from public.direct_messages where id='b5415350-b51f-43ce-b039-47c297260004') then raise exception 'Inactive peer read'; end if;
end $$;
-- Missing uid with authenticated role must also fail closed.
select set_config('request.jwt.claim.sub','',true);
do $$ begin
 if exists(select 1 from public.direct_messages where id='b5415350-b51f-43ce-b039-47c297260004') then raise exception 'Null identity read'; end if;
end $$;
reset role;
set local role anon;
do $$ begin
 begin
  perform * from public.direct_messages;
  raise exception 'Anonymous message read';
 exception when insufficient_privilege then null; end;
 begin
  perform public.intimo_can_read_message('b5415350-b51f-43ce-b039-47c297260001','b5415350-b51f-43ce-b039-47c297260002');
  raise exception 'Anonymous helper execution';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'Actual staging roles: all message RLS assertions passed; transaction rolled back' as result;
