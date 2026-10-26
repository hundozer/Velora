-- Run against staging after the member_rooms migration. The transaction is always rolled back.
begin;
insert into public.profiles(id,auth_id,email,username,age_verification_status) values
 ('78100500-0000-4000-8000-000000000091','78100500-0000-4000-8000-000000000091','rollback-room-owner@example.invalid','rollback-room-owner','AGE_DECLARED'),
 ('78100500-0000-4000-8000-000000000092','78100500-0000-4000-8000-000000000092','rollback-room-peer@example.invalid','rollback-room-peer','AGE_DECLARED');
insert into public.rooms(id,title,description,creator_id,created_at,expires_at,locked)
 values ('rollback-room','Rollback room','Isolated schema fixture','78100500-0000-4000-8000-000000000091',now(),now()+interval '30 days',true);
insert into public.room_members(room_id,profile_id) values ('rollback-room','78100500-0000-4000-8000-000000000092');
insert into public.room_messages(room_id,sender_id,body) values ('rollback-room','78100500-0000-4000-8000-000000000092','Fixture');
insert into public.room_presence(room_id,profile_id) values ('rollback-room','78100500-0000-4000-8000-000000000092');
do $$ begin
 if (select count(*) from public.rooms where id='rollback-room' and locked and expires_at=created_at+interval '30 days') <> 1 then raise exception 'room fixture failed'; end if;
 if (select count(*) from public.room_messages where room_id='rollback-room') <> 1 then raise exception 'message fixture failed'; end if;
 if (select count(*) from public.room_presence where room_id='rollback-room') <> 1 then raise exception 'presence fixture failed'; end if;
 if has_table_privilege('authenticated','public.rooms','SELECT') or has_table_privilege('anon','public.room_messages','SELECT') or has_table_privilege('authenticated','public.room_members','INSERT') then raise exception 'direct grants unexpectedly present'; end if;
end $$;
rollback;
select jsonb_build_object('fixture_rooms',(select count(*) from public.rooms where id='rollback-room'),'fixture_profiles',(select count(*) from public.profiles where email like 'rollback-room-%@example.invalid')) as cleanup;
