-- Real staging or disposable CI. Fixtures and changes are rollback-only.
begin;
do $$ begin
 if exists(select 1 from public.profiles where id in ('78100200-0000-4000-8000-000000000001','78100200-0000-4000-8000-000000000002')) then raise exception 'Fixture collision'; end if;
end $$;
insert into public.profiles(id,auth_id,email,display_name) values
 ('78100200-0000-4000-8000-000000000001','78100200-0000-4000-8000-000000000001','company-sql-a@example.invalid','Synthetic company A'),
 ('78100200-0000-4000-8000-000000000002','78100200-0000-4000-8000-000000000002','company-sql-b@example.invalid','Synthetic company B');
set local role service_role;
do $$ declare a uuid:='78100200-0000-4000-8000-000000000001'; b uuid:='78100200-0000-4000-8000-000000000002'; event_id uuid:=gen_random_uuid(); plan_id uuid:=gen_random_uuid(); start_at timestamptz:=now()+interval '7 days'; begin
 insert into public.scene_events(id,title,kind,starts_at,organiser,url,status) values(event_id,'Synthetic company event','MUNCH',start_at,'Synthetic test','https://example.invalid/event','PUBLISHED');
 insert into public.dating_ads(id,author_id,author_name,title,text,category,validity_days,status,moderation_status,starts_at,expires_at,scene_event_id)
 values(plan_id,a,'Synthetic company A','Find company','Rollback-only invitation','PARTY',1,'active','APPROVED',start_at,start_at+interval '3 hours',event_id);
 if not exists(select 1 from public.dating_ads where id=plan_id and scene_event_id=event_id) then raise exception 'Link not saved'; end if;
 begin
  update public.dating_ads set starts_at=start_at+interval '1 hour' where id=plan_id;
  raise exception 'Forged time accepted';
 exception when raise_exception then if sqlerrm='Forged time accepted' then raise; end if; end;
 insert into public.direct_messages(conversation_id,sender_id,receiver_id,sender_name,content,plan_id) values('company-sql-reply',b,a,'Synthetic B','Reply before reschedule',plan_id);
 update public.scene_events set starts_at=start_at+interval '1 day' where id=event_id;
 if (select status from public.dating_ads where id=plan_id)<>'closed' then raise exception 'Reschedule did not close invitation'; end if;
 begin
  insert into public.direct_messages(conversation_id,sender_id,receiver_id,sender_name,content,plan_id) values('company-sql-reply',b,a,'Synthetic B','Must fail after reschedule',plan_id);
  raise exception 'Stale event reply accepted';
 exception when raise_exception then if sqlerrm='Stale event reply accepted' then raise; end if; end;
 update public.scene_events set status='REJECTED' where id=event_id;
 begin
  insert into public.dating_ads(author_id,author_name,title,text,category,validity_days,starts_at,expires_at,scene_event_id) values(a,'Synthetic A','Invalid','Must not save','PARTY',1,start_at+interval '1 day',start_at+interval '27 hours',event_id);
  raise exception 'Hidden event invitation accepted';
 exception when raise_exception then if sqlerrm='Hidden event invitation accepted' then raise; end if; end;
 update public.scene_events set status='PUBLISHED' where id=event_id;
 if (select status from public.dating_ads where id=plan_id)<>'closed' then raise exception 'Republishing resurrected invitation'; end if;
 insert into public.dating_ads(author_id,author_name,title,text,category,validity_days,status,starts_at,expires_at,scene_event_id) values(a,'Synthetic A','Fresh link','Fresh invitation','PARTY',1,'active',start_at+interval '1 day',start_at+interval '27 hours',event_id);
 delete from public.scene_events where id=event_id;
 if exists(select 1 from public.dating_ads where author_id=a and status='active') then raise exception 'Event deletion left active invitation'; end if;
end $$;
reset role;
do $$ begin
 if has_table_privilege('anon','public.dating_ads','SELECT') or has_table_privilege('authenticated','public.dating_ads','INSERT') then raise exception 'Member invitation data exposed'; end if;
 if has_table_privilege('anon','public.scene_events','SELECT') then raise exception 'Raw Scene table exposed'; end if;
end $$;
rollback;
