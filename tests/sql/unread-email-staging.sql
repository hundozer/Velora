-- Actual staging roles and canonical schema; fixtures and every change roll back.
begin;
do $$ begin
 if to_regclass('intimo_migration_audit.legacy_profile_identity') is null then raise exception 'Recovered staging required'; end if;
 if exists(select 1 from public.profiles where email like 'unread-sql-%@example.invalid') then raise exception 'Fixture collision'; end if;
end $$;
insert into public.profiles(id,auth_id,email,display_name,account_status,last_active_at) values
('4f87de18-0221-484f-9778-000000000001','4f87de18-0221-484f-9778-000000000001','unread-sql-a@example.invalid','SQL A','ACTIVE',now()-interval '1 day'),
('4f87de18-0221-484f-9778-000000000002','4f87de18-0221-484f-9778-000000000002','unread-sql-b@example.invalid','SQL B','ACTIVE',now()-interval '1 day');
insert into public.direct_messages(conversation_id,sender_id,receiver_id,sender_name,content) select 'unread-sql-test','4f87de18-0221-484f-9778-000000000001','4f87de18-0221-484f-9778-000000000002','SQL A','never emailed' from generate_series(1,2);
update public.unread_email_outbox set due_at=now()-interval '1 minute' where profile_id='4f87de18-0221-484f-9778-000000000002';
set local role service_role;
do $$ declare q public.unread_email_outbox; payload jsonb; begin
 if (select count(*) from public.unread_email_outbox where profile_id='4f87de18-0221-484f-9778-000000000002')<>1 then raise exception 'Duplicate queued job'; end if;
 select * into q from public.intimo_claim_unread_emails(3);
 if q.id is null then raise exception 'Eligible unread job not claimed'; end if;
 if exists(select 1 from public.intimo_claim_unread_emails(3)) then raise exception 'Lease claimed twice'; end if;
 update public.direct_messages set is_opened=true where conversation_id='unread-sql-test';
 payload:=public.intimo_prepare_unread_email(q.id,q.lease_id,'{"to":"unread-sql-b@example.invalid"}');
 if payload is not null then raise exception 'Read message prepared'; end if;
end $$;
reset role;
-- Additional unread messages create a fresh job; opt-out cancels it.
insert into public.direct_messages(conversation_id,sender_id,receiver_id,sender_name,content) values('unread-sql-test','4f87de18-0221-484f-9778-000000000001','4f87de18-0221-484f-9778-000000000002','SQL A','private');
update public.unread_email_outbox set due_at=now()-interval '1 minute' where status='PENDING';
select public.intimo_email_opt_out('4f87de18-0221-484f-9778-000000000002','MESSAGE');
select public.intimo_email_opt_out('4f87de18-0221-484f-9778-000000000002','INTEREST');
do $$ begin
 if not (select email_opt_out @> array['MESSAGE','INTEREST'] from public.profiles where id='4f87de18-0221-484f-9778-000000000002') then raise exception 'Opt-out lost category'; end if;
 if exists(select 1 from public.intimo_claim_unread_emails(3)) then raise exception 'Opt-out ignored'; end if;
end $$;
update public.profiles set email_opt_out='{}' where id='4f87de18-0221-484f-9778-000000000002';
-- Both block directions and inactive accounts suppress eligibility.
insert into public.user_blocks(blocker_id,blocked_profile_id) values('4f87de18-0221-484f-9778-000000000001','4f87de18-0221-484f-9778-000000000002');
do $$ begin if public.intimo_has_unread_email('4f87de18-0221-484f-9778-000000000002','MESSAGE') then raise exception 'Sender block ignored'; end if; end $$;
update public.user_blocks set blocker_id='4f87de18-0221-484f-9778-000000000002',blocked_profile_id='4f87de18-0221-484f-9778-000000000001' where blocker_id='4f87de18-0221-484f-9778-000000000001';
do $$ begin if public.intimo_has_unread_email('4f87de18-0221-484f-9778-000000000002','MESSAGE') then raise exception 'Receiver block ignored'; end if; end $$;
delete from public.user_blocks where blocker_id='4f87de18-0221-484f-9778-000000000002';
update public.profiles set account_status='DEACTIVATED' where id='4f87de18-0221-484f-9778-000000000001';
do $$ begin if public.intimo_has_unread_email('4f87de18-0221-484f-9778-000000000002','MESSAGE') then raise exception 'Inactive sender ignored'; end if; end $$;
update public.profiles set account_status='ACTIVE' where id='4f87de18-0221-484f-9778-000000000001';
insert into public.direct_messages(conversation_id,sender_id,receiver_id,sender_name,content) values('unread-sql-test','4f87de18-0221-484f-9778-000000000001','4f87de18-0221-484f-9778-000000000002','SQL A','private');
update public.unread_email_outbox set due_at=now()-interval '1 minute' where status='PENDING';
update public.profiles set last_active_at=now() where id='4f87de18-0221-484f-9778-000000000002';
do $$ begin if exists(select 1 from public.intimo_claim_unread_emails(3)) then raise exception 'Active member not deferred'; end if; end $$;
update public.profiles set last_active_at=now()-interval '1 day' where id='4f87de18-0221-484f-9778-000000000002';
update public.unread_email_outbox set due_at=now()-interval '1 minute' where status='PENDING';
set local role service_role;
do $$ declare q public.unread_email_outbox; original uuid; payload jsonb; begin
 select * into q from public.intimo_claim_unread_emails(3); original:=q.id;
 payload:=public.intimo_prepare_unread_email(q.id,q.lease_id,'{"to":"unread-sql-b@example.invalid","html":"original"}');
 if payload->>'html'<>'original' then raise exception 'Payload not persisted'; end if;
 perform public.intimo_finish_unread_email(q.id,q.lease_id,null,'provider_http_503');
 if exists(select 1 from public.email_send_state where profile_id=q.profile_id) then raise exception 'Failure consumed throttle'; end if;
 update public.unread_email_outbox set due_at=now()-interval '1 minute' where id=q.id;
 select * into q from public.intimo_claim_unread_emails(3);
 if q.id<>original then raise exception 'Retry changed idempotency identity'; end if;
 payload:=public.intimo_prepare_unread_email(q.id,q.lease_id,'{"to":"unread-sql-b@example.invalid","html":"changed"}');
 if payload->>'html'<>'original' then raise exception 'Retry changed provider payload'; end if;
 -- A terminated worker loses its lease; the job is recoverable with the same ID.
 update public.unread_email_outbox set lease_until=now()-interval '1 minute' where id=q.id;
 select * into q from public.intimo_claim_unread_emails(3);
 if q.id<>original then raise exception 'Expired lease not recovered'; end if;
 perform public.intimo_finish_unread_email(q.id,q.lease_id,'provider-test-id',null);
 if not exists(select 1 from public.email_send_state where profile_id=q.profile_id and category='MESSAGE') then raise exception 'Accepted send not throttled'; end if;
 if exists(select 1 from public.unread_email_outbox o where o.id=q.id and o.payload is not null) then raise exception 'Terminal payload retained'; end if;
end $$;
reset role;
insert into public.direct_messages(conversation_id,sender_id,receiver_id,sender_name,content) values('unread-sql-test','4f87de18-0221-484f-9778-000000000001','4f87de18-0221-484f-9778-000000000002','SQL A','private');
update public.unread_email_outbox set due_at=now()-interval '1 minute' where status='PENDING';
do $$ begin if exists(select 1 from public.intimo_claim_unread_emails(3)) then raise exception 'Three-hour throttle bypassed'; end if; end $$;
delete from public.email_send_state where profile_id='4f87de18-0221-484f-9778-000000000002';
update public.unread_email_outbox set due_at=now()-interval '1 minute',first_attempt_at=now()-interval '24 hours' where status='PENDING';
do $$ begin if exists(select 1 from public.intimo_claim_unread_emails(3)) then raise exception 'Expired idempotency window retried'; end if; end $$;
set local role anon;
do $$ begin
 begin perform * from public.unread_email_outbox; raise exception 'Anonymous queue read'; exception when insufficient_privilege then null; end;
 begin perform public.intimo_claim_unread_emails(3); raise exception 'Anonymous queue RPC'; exception when insufficient_privilege then null; end;
end $$;
set local role authenticated;
do $$ begin
 begin perform * from public.unread_email_outbox; raise exception 'Member queue read'; exception when insufficient_privilege then null; end;
 begin perform public.intimo_claim_unread_emails(3); raise exception 'Member queue RPC'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select 'unread email SQL behavior PASS; all fixtures rolled back' as result;
rollback;
