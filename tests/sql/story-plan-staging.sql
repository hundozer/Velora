-- Actual staging roles. No files/Auth identities created; all fixtures roll back.
begin;
insert into public.profiles(id,auth_id,email,display_name,account_status,age_verification_status,profile_visibility,discovery_disabled) values
 ('78100300-0000-4000-8000-000000000001','78100300-0000-4000-8000-000000000001','stories-sql-a@example.invalid','Synthetic A','ACTIVE','AGE_DECLARED','MEMBERS_ONLY',false),
 ('78100300-0000-4000-8000-000000000002','78100300-0000-4000-8000-000000000002','stories-sql-b@example.invalid','Synthetic B','ACTIVE','AGE_DECLARED','MEMBERS_ONLY',false),
 ('78100300-0000-4000-8000-000000000003','78100300-0000-4000-8000-000000000003','stories-sql-c@example.invalid','Synthetic C','ACTIVE','AGE_DECLARED','MEMBERS_ONLY',false);
set local role service_role;
do $test$
declare a uuid:='78100300-0000-4000-8000-000000000001'; b uuid:='78100300-0000-4000-8000-000000000002'; media uuid:=gen_random_uuid(); invitation uuid:=gen_random_uuid(); story uuid;
begin
 insert into public.dating_ads(id,author_id,author_name,category,title,text,starts_at,expires_at,status,moderation_status,validity_days)
 values(invitation,a,'Synthetic A','DATE','Take us out','Rollback only invitation',now(),now()+interval '3 hours','active','APPROVED',1);
 insert into public.media_objects(id,owner_id,object_key,media_type,mime_type,byte_size,visibility,upload_status,processing_status,moderation_status,content_rating,category)
 values(media,a,'synthetic/no-object','IMAGE','image/jpeg',100,'PRIVATE','AVAILABLE','READY','PENDING_REVIEW','NON_EXPLICIT','STORY');
 begin
  perform public.intimo_publish_plan_story(b,media,'Foreign invitation','MEMBERS','{}',invitation);
  raise exception 'Foreign owner allowed';
 exception when raise_exception then if sqlerrm<>'Invitation unavailable' then raise; end if; end;
 update public.dating_ads set status='closed' where id=invitation;
 begin
  perform public.intimo_publish_plan_story(a,media,'Closed invitation','MEMBERS','{}',invitation);
  raise exception 'Closed invitation allowed';
 exception when raise_exception then if sqlerrm<>'Invitation unavailable' then raise; end if; end;
 update public.dating_ads set status='active',starts_at=now()-interval '3 hours',expires_at=now()-interval '1 second' where id=invitation;
 begin
  perform public.intimo_publish_plan_story(a,media,'Expired invitation','MEMBERS','{}',invitation);
  raise exception 'Expired invitation allowed';
 exception when raise_exception then if sqlerrm<>'Invitation unavailable' then raise; end if; end;
 update public.dating_ads set expires_at=now()+interval '3 hours' where id=invitation;
 story:=public.intimo_publish_plan_story(a,media,'Join us','SELECTED',array[b]);
 if not exists(select 1 from public.member_stories where id=story and plan_id=invitation and audience='SELECTED' and recipients=array[b]) then raise exception 'Link/audience lost'; end if;
 if public.intimo_story_visible(b,story) then raise exception 'Unreviewed cover leaked'; end if;
 update public.media_objects set moderation_status='APPROVED' where id=media;
 if not public.intimo_story_visible(b,story) then raise exception 'Selected viewer denied'; end if;
 insert into public.user_blocks(blocker_id,blocked_profile_id) values(b,a);
 if public.intimo_story_visible(b,story) then raise exception 'Block bypass'; end if;
 delete from public.dating_ads where id=invitation;
 if not exists(select 1 from public.member_stories where id=story and plan_id is null) then raise exception 'Plan deletion failed'; end if;
 if has_function_privilege('anon','public.intimo_publish_plan_story(uuid,uuid,text,text,uuid[],uuid)','EXECUTE') or has_function_privilege('authenticated','public.intimo_publish_plan_story(uuid,uuid,text,text,uuid[],uuid)','EXECUTE') then raise exception 'Member RPC grant'; end if;
end $test$;
reset role;
rollback;
select 'PASS: owner, closed, expired, audience, review, block, deletion and role guards; fixtures rolled back' as result;
