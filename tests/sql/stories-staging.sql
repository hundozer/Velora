-- Actual staging roles. No files/Auth identities created; all fixtures roll back.
begin;
insert into public.profiles(id,auth_id,email,display_name,account_status,age_verification_status,profile_visibility,discovery_disabled) values
 ('78100300-0000-4000-8000-000000000001','78100300-0000-4000-8000-000000000001','stories-sql-a@example.invalid','Synthetic A','ACTIVE','AGE_DECLARED','MEMBERS_ONLY',false),
 ('78100300-0000-4000-8000-000000000002','78100300-0000-4000-8000-000000000002','stories-sql-b@example.invalid','Synthetic B','ACTIVE','AGE_DECLARED','MEMBERS_ONLY',false),
 ('78100300-0000-4000-8000-000000000003','78100300-0000-4000-8000-000000000003','stories-sql-c@example.invalid','Synthetic C','ACTIVE','AGE_DECLARED','MEMBERS_ONLY',false);
set local role service_role;
do $test$
declare a uuid:='78100300-0000-4000-8000-000000000001'; b uuid:='78100300-0000-4000-8000-000000000002'; c uuid:='78100300-0000-4000-8000-000000000003'; media uuid:=gen_random_uuid(); story uuid;
begin
 insert into public.media_objects(id,owner_id,object_key,media_type,mime_type,byte_size,visibility,upload_status,processing_status,moderation_status,content_rating,category)
 values(media,a,'synthetic/no-object','IMAGE','image/jpeg',100,'PRIVATE','AVAILABLE','READY','PENDING_REVIEW','NON_EXPLICIT','STORY');
 story:=public.intimo_publish_story(a,media,'Rollback-only photo','SELECTED',array[b]);
 if public.intimo_story_visible(b,story) then raise exception 'Unreviewed story leaked'; end if;
 if not public.intimo_story_visible(a,story) then raise exception 'Author preview denied'; end if;
 update public.media_objects set moderation_status='APPROVED' where id=media;
 if not public.intimo_story_visible(b,story) then raise exception 'Selected reader denied'; end if;
 if public.intimo_story_visible(c,story) then raise exception 'Excluded reader leaked'; end if;
 if exists(select 1 from public.intimo_story_list(c,array[a])) then raise exception 'Excluded aura leaked'; end if;
 if not public.intimo_view_story(b,story) then raise exception 'View marker failed'; end if;
 if not (select viewed from public.intimo_story_list(b,array[a])) then raise exception 'Viewed marker missing'; end if;
 update public.member_stories set audience='FRIENDS',recipients='{}' where id=story;
 if public.intimo_story_visible(b,story) then raise exception 'Non-friend leaked'; end if;
 insert into public.friendships(requester_id,addressee_id,status) values(a,b,'ACCEPTED');
 if not public.intimo_story_visible(b,story) then raise exception 'Friend denied'; end if;
 insert into public.user_blocks(blocker_id,blocked_profile_id) values(b,a);
 if public.intimo_story_visible(b,story) or public.intimo_view_story(b,story) then raise exception 'Viewer block bypassed'; end if;
 delete from public.user_blocks where blocker_id=b and blocked_profile_id=a;
 insert into public.user_blocks(blocker_id,blocked_profile_id) values(a,b);
 if public.intimo_story_visible(b,story) then raise exception 'Author block bypassed'; end if;
 delete from public.user_blocks where blocker_id=a and blocked_profile_id=b;
 update public.member_stories set audience='MEMBERS' where id=story;
 if not public.intimo_story_visible(c,story) then raise exception 'Eligible member denied'; end if;
 update public.profiles set profile_visibility='FRIENDS_ONLY' where id=a;
 if public.intimo_story_visible(c,story) then raise exception 'Profile visibility bypassed'; end if;
 update public.profiles set profile_visibility='MEMBERS_ONLY',discovery_disabled=true where id=a;
 if public.intimo_story_visible(b,story) then raise exception 'Hidden author leaked'; end if;
 update public.profiles set discovery_disabled=false where id=a;
 update public.profiles set account_status='DEACTIVATED' where id=b;
 if public.intimo_story_visible(b,story) then raise exception 'Inactive reader allowed'; end if;
 update public.profiles set account_status='ACTIVE',age_verification_status='UNVERIFIED' where id=b;
 if public.intimo_story_visible(b,story) then raise exception 'Non-adult reader allowed'; end if;
 update public.profiles set age_verification_status='AGE_DECLARED' where id=b;
 update public.profiles set age_verification_status='UNVERIFIED' where id=a;
 if public.intimo_story_visible(b,story) then raise exception 'Unverified author leaked'; end if;
 update public.profiles set age_verification_status='AGE_DECLARED' where id=a;
 update public.media_objects set moderation_status='REMOVED' where id=media;
 if public.intimo_story_visible(b,story) then raise exception 'Moderation removal bypassed'; end if;
 update public.media_objects set moderation_status='APPROVED' where id=media;
 begin
  update public.media_objects set visibility='MEMBERS_ONLY' where id=media;
  raise exception 'Story media escaped private delivery';
 exception when raise_exception then if sqlerrm='Story media escaped private delivery' then raise; end if; end;
 begin
  update public.media_objects set category='MESSAGE' where id=media;
  raise exception 'Story repurposed';
 exception when raise_exception then if sqlerrm='Story repurposed' then raise; end if; end;
 update public.member_stories set deleted_at=now() where id=story;
 if public.intimo_story_visible(b,story) then raise exception 'Deleted story allowed'; end if;
 update public.member_stories set deleted_at=null,created_at=now()-interval '25 hours',expires_at=now()-interval '1 hour' where id=story;
 if public.intimo_story_visible(a,story) or public.intimo_story_visible(b,story) then raise exception 'Expired story allowed'; end if;
 delete from public.media_objects where id=media;
 if exists(select 1 from public.member_stories where id=story) or exists(select 1 from public.story_views where story_id=story) then raise exception 'Photo deletion left story metadata'; end if;
end $test$;
reset role;
set local role anon;
do $$ begin
 begin perform 1 from public.member_stories;raise exception 'Anon read allowed';exception when insufficient_privilege then null;end;
 begin perform public.intimo_story_visible(null,null);raise exception 'Anon RPC allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
set local role authenticated;
do $$ begin
 begin perform 1 from public.story_views;raise exception 'Member direct view-history read allowed';exception when insufficient_privilege then null;end;
 begin insert into public.member_stories(owner_id,media_id,audience) values(gen_random_uuid(),gen_random_uuid(),'MEMBERS');raise exception 'Member direct write allowed';exception when insufficient_privilege then null;end;
 begin perform public.intimo_story_list(null,null);raise exception 'Member service RPC allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;
