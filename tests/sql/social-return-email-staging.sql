-- Actual staging schema/roles or disposable CI. All fixtures roll back.
begin;
do $$ begin
 if exists(select 1 from public.unread_email_outbox where status in ('PENDING','PROCESSING')) then raise exception 'Use an isolated idle staging queue'; end if;
 if exists(select 1 from public.profiles where id in ('78100100-0000-4000-8000-000000000001','78100100-0000-4000-8000-000000000002')) then raise exception 'Fixture collision'; end if;
end $$;
insert into public.profiles(id,auth_id,email,display_name,account_status,last_active_at) values
 ('78100100-0000-4000-8000-000000000001','78100100-0000-4000-8000-000000000001','social-sql-a@example.invalid','Private SQL A','ACTIVE',now()-interval '1 day'),
 ('78100100-0000-4000-8000-000000000002','78100100-0000-4000-8000-000000000002','social-sql-b@example.invalid','Private SQL B','ACTIVE',now()-interval '1 day');
set local role service_role;
do $$ declare a uuid:='78100100-0000-4000-8000-000000000001'; b uuid:='78100100-0000-4000-8000-000000000002'; begin
 if not public.intimo_save_interest(a,b) then raise exception 'First interest failed'; end if;
 if exists(select 1 from public.unread_email_outbox where profile_id in(a,b)) then raise exception 'One-sided interest emailed'; end if;
 if (select count(*) from public.notifications where user_id=b and type='INTEREST')<>1 then raise exception 'One-sided in-app signal lost'; end if;
 if not public.intimo_save_interest(b,a) then raise exception 'Mutual interest failed'; end if;
 if public.intimo_save_interest(b,a) then raise exception 'Repeated interest not idempotent'; end if;
 if (select count(*) from public.unread_email_outbox where profile_id in(a,b) and category='INTEREST')<>2 then raise exception 'Both sides not queued exactly once'; end if;
 if (select count(*) from public.notifications where user_id in(a,b) and type='MUTUAL_INTEREST')<>2 then raise exception 'Mutual notifications duplicated'; end if;
 if not public.intimo_has_social_return_email(a,'INTEREST') or not public.intimo_has_social_return_email(b,'INTEREST') then raise exception 'Mutual event ineligible'; end if;
 update public.notifications set is_read=true where user_id=a and type='MUTUAL_INTEREST';
 if public.intimo_has_social_return_email(a,'INTEREST') then raise exception 'Read notification still eligible'; end if;
 update public.user_blocks set blocker_id=a where false;
 insert into public.user_blocks(blocker_id,blocked_profile_id) values(a,b);
 if public.intimo_has_social_return_email(b,'INTEREST') then raise exception 'Peer block ignored'; end if;
 update public.user_blocks set blocker_id=b,blocked_profile_id=a where blocker_id=a and blocked_profile_id=b;
 if public.intimo_has_social_return_email(b,'INTEREST') then raise exception 'Recipient block ignored'; end if;
 delete from public.user_blocks where blocker_id=b and blocked_profile_id=a;
 update public.profiles set account_status='DEACTIVATED' where id=a;
 if public.intimo_has_social_return_email(b,'INTEREST') then raise exception 'Inactive peer ignored'; end if;
 update public.profiles set account_status='ACTIVE',is_demo=true where id=a;
 if public.intimo_has_social_return_email(b,'INTEREST') then raise exception 'Demo peer ignored'; end if;
 update public.profiles set is_demo=false where id=a;
 delete from public.interests where from_id=a and to_id=b;
 if public.intimo_has_social_return_email(b,'INTEREST') then raise exception 'Withdrawn interest emailed'; end if;
end $$;
-- Fresh mutual event, one job due at a time. Verify prepare-time safety,
-- retry payload stability, provider receipt acknowledgement and throttling.
delete from public.unread_email_outbox where profile_id in('78100100-0000-4000-8000-000000000001','78100100-0000-4000-8000-000000000002');
select public.intimo_save_interest('78100100-0000-4000-8000-000000000001','78100100-0000-4000-8000-000000000002');
do $$ declare a uuid:='78100100-0000-4000-8000-000000000001'; b uuid:='78100100-0000-4000-8000-000000000002'; q public.unread_email_outbox; prepared jsonb; begin
 update public.unread_email_outbox set due_at=now()+interval '1 day' where profile_id in(a,b);
 update public.unread_email_outbox set due_at=now()-interval '1 minute' where profile_id=b;
 select * into q from public.intimo_claim_unread_emails(3);
 if q.id is null or q.profile_id<>b then raise exception 'Mutual job not claimed'; end if;
 if exists(select 1 from public.intimo_claim_unread_emails(3)) then raise exception 'Lease claimed twice'; end if;
 prepared:=public.intimo_prepare_unread_email(q.id,q.lease_id,'{"to":"social-sql-b@example.invalid","subject":"You have an update on Intimo","html":"discreet"}');
 if prepared is null then raise exception 'Eligible mutual prepare failed'; end if;
 perform public.intimo_finish_unread_email(q.id,q.lease_id,null,'provider_http_503');
 if exists(select 1 from public.email_send_state where profile_id=b and category='INTEREST') then raise exception 'Failure consumed throttle'; end if;
 update public.unread_email_outbox set due_at=now()-interval '1 minute' where id=q.id;
 select * into q from public.intimo_claim_unread_emails(3);
 if public.intimo_prepare_unread_email(q.id,q.lease_id,'{"to":"social-sql-b@example.invalid","html":"must not replace retry"}') is distinct from prepared then raise exception 'Retry payload changed'; end if;
 if not public.intimo_finish_unread_email(q.id,q.lease_id,'synthetic-provider-receipt') then raise exception 'Queue acknowledgement failed'; end if;
 if exists(select 1 from public.return_email_events where job_id=q.id) then raise exception 'Terminal relationship references retained'; end if;
 delete from public.interests where from_id=a and to_id=b;
 perform public.intimo_save_interest(a,b);
 update public.unread_email_outbox set due_at=now()-interval '1 minute' where profile_id=b and status='PENDING';
 if exists(select 1 from public.intimo_claim_unread_emails(3)) then raise exception 'Category throttle bypassed'; end if;
 if not exists(select 1 from public.unread_email_outbox where profile_id=b and status='PENDING' and due_at>now()+interval '2 hours') then raise exception 'Throttled alert not deferred'; end if;
end $$;
-- Request/approval delivery follows live state. Denial/revocation stays silent;
-- repeated grants do not change expiry, emit notifications or create jobs.
delete from public.unread_email_outbox where profile_id in('78100100-0000-4000-8000-000000000001','78100100-0000-4000-8000-000000000002');
do $$ declare a uuid:='78100100-0000-4000-8000-000000000001'; b uuid:='78100100-0000-4000-8000-000000000002'; first_grant jsonb; again jsonb; q public.unread_email_outbox; n integer; begin
 if not public.intimo_request_private_access(a,b) then raise exception 'Private request failed'; end if;
 if public.intimo_request_private_access(a,b) then raise exception 'Repeated request accepted'; end if;
 if not public.intimo_has_social_return_email(a,'PRIVATE_ACCESS') then raise exception 'Owner request alert missing'; end if;
 first_grant:=public.intimo_decide_private_access(a,b,'GRANT_ONCE');
 if public.intimo_has_social_return_email(a,'PRIVATE_ACCESS') then raise exception 'Resolved request still emailed'; end if;
 if not public.intimo_has_social_return_email(b,'PRIVATE_ACCESS') then raise exception 'Approval alert missing'; end if;
 select count(*) into n from public.notifications where user_id=b and type='PRIVATE_ACCESS_GRANTED';
 again:=public.intimo_decide_private_access(a,b,'GRANT_ONCE');
 if again->>'expires_at' is distinct from first_grant->>'expires_at' or (select count(*) from public.notifications where user_id=b and type='PRIVATE_ACCESS_GRANTED')<>n then raise exception 'Repeated grant changed state or notified twice'; end if;
 update public.unread_email_outbox set due_at=now()+interval '1 day' where profile_id in(a,b);
 update public.unread_email_outbox set due_at=now()-interval '1 minute' where profile_id=b and category='PRIVATE_ACCESS';
 select * into q from public.intimo_claim_unread_emails(3);
 if q.id is null then raise exception 'Approval not claimed'; end if;
 perform public.intimo_decide_private_access(a,b,'REVOKE');
 if public.intimo_prepare_unread_email(q.id,q.lease_id,'{"to":"social-sql-b@example.invalid"}') is not null then raise exception 'Revoked access prepared'; end if;
 if exists(select 1 from public.notifications where user_id in(a,b) and type in('PRIVATE_ACCESS_DENIED','PRIVATE_ACCESS_REVOKED')) then raise exception 'Silent outcome notified'; end if;
 if not public.intimo_request_private_access(a,b) then raise exception 'Re-request after revoke failed'; end if;
 perform public.intimo_decide_private_access(a,b,'DENY');
 if public.intimo_has_social_return_email(a,'PRIVATE_ACCESS') or public.intimo_request_private_access(a,b) then raise exception 'Denied request emailed or cooldown bypassed'; end if;
 update public.album_access_grants set decided_at=now()-interval '8 days' where owner_id=a and viewer_id=b;
 perform public.intimo_request_private_access(a,b);
 perform public.intimo_decide_private_access(a,b,'GRANT_ONCE');
 update public.album_access_grants set expires_at=now()-interval '1 minute' where owner_id=a and viewer_id=b;
 if public.intimo_has_social_return_email(b,'PRIVATE_ACCESS') then raise exception 'Expired grant emailed'; end if;
end $$;
-- Preferences are rechecked at dispatch, including signed-link RPC semantics.
delete from public.unread_email_outbox where profile_id in('78100100-0000-4000-8000-000000000001','78100100-0000-4000-8000-000000000002');
do $$ declare a uuid:='78100100-0000-4000-8000-000000000001'; b uuid:='78100100-0000-4000-8000-000000000002'; begin
 perform public.intimo_request_private_access(a,b);
 perform public.intimo_email_opt_out(a,'PRIVATE_ACCESS');
 update public.unread_email_outbox set due_at=now()-interval '1 minute' where profile_id=a;
 if exists(select 1 from public.intimo_claim_unread_emails(3)) then raise exception 'Private preference ignored'; end if;
 if exists(select 1 from public.return_email_events e join public.unread_email_outbox q on q.id=e.job_id where q.profile_id=a and q.status='CANCELLED') then raise exception 'Cancelled references retained'; end if;
 update public.profiles set email_opt_out='{}' where id=a;
 perform public.intimo_decide_private_access(a,b,'GRANT');
 perform public.intimo_email_opt_out(b,'ALL');
 update public.unread_email_outbox set due_at=now()-interval '1 minute' where profile_id=b and status='PENDING';
 if exists(select 1 from public.intimo_claim_unread_emails(3)) then raise exception 'Global preference ignored'; end if;
end $$;
-- Existing message categories retain their original semantics.
update public.profiles set email_opt_out='{}' where id='78100100-0000-4000-8000-000000000002';
insert into public.direct_messages(conversation_id,sender_id,receiver_id,sender_name,content) values('social-sql-message','78100100-0000-4000-8000-000000000001','78100100-0000-4000-8000-000000000002','Private SQL A','never emailed');
do $$ begin
 if not public.intimo_has_unread_email('78100100-0000-4000-8000-000000000002','MESSAGE') then raise exception 'Message eligibility regressed'; end if;
 update public.direct_messages set is_opened=true where conversation_id='social-sql-message';
 if public.intimo_has_unread_email('78100100-0000-4000-8000-000000000002','MESSAGE') then raise exception 'Read message eligibility regressed'; end if;
end $$;
reset role;
do $$ declare role_name text; function_name text; begin
 foreach role_name in array array['anon','authenticated'] loop
  if has_table_privilege(role_name,'public.return_email_events','SELECT') or has_table_privilege(role_name,'public.return_email_events','INSERT') then raise exception 'Event table exposed to %',role_name; end if;
  foreach function_name in array array['intimo_save_interest(uuid,uuid)','intimo_request_private_access(uuid,uuid)','intimo_decide_private_access(uuid,uuid,text)','intimo_queue_return_event(uuid,text,uuid,text,timestamptz)','intimo_has_social_return_email(uuid,text)'] loop
   if has_function_privilege(role_name,'public.'||function_name,'EXECUTE') then raise exception 'Privileged RPC % exposed to %',function_name,role_name; end if;
  end loop;
 end loop;
end $$;
rollback;
