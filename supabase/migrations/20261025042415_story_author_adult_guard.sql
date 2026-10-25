-- Recheck author adulthood after publication as well as viewer adulthood.
create or replace function public.intimo_story_visible(p_viewer uuid,p_story uuid) returns boolean
language sql stable security invoker set search_path='' as $$
 select exists(
 select 1 from public.member_stories s
 join public.profiles o on o.id=s.owner_id
 join public.profiles v on v.id=p_viewer
 join public.media_objects m on m.id=s.media_id and m.owner_id=s.owner_id
 where s.id=p_story and s.deleted_at is null and s.expires_at>now()
 and o.account_status='ACTIVE' and v.account_status='ACTIVE'
 and o.age_verification_status in ('AGE_DECLARED','AGE_VERIFIED')
 and v.age_verification_status in ('AGE_DECLARED','AGE_VERIFIED')
 and o.auth_id is not null and v.auth_id is not null
 and m.category='STORY' and m.media_type='IMAGE' and m.content_rating='NON_EXPLICIT'
 and m.visibility='PRIVATE' and m.upload_status='AVAILABLE' and m.processing_status='READY'
 and m.moderation_status not in ('REJECTED','HIDDEN','REMOVED')
 and (s.owner_id=p_viewer or (
 m.moderation_status='APPROVED' and not o.discovery_disabled
 and not exists(select 1 from public.user_blocks b where
 (b.blocker_id=p_viewer and b.blocked_profile_id=o.id) or (b.blocker_id=o.id and b.blocked_profile_id=p_viewer))
 and (o.profile_visibility in ('EVERYONE','MEMBERS_ONLY') or
 (o.profile_visibility='FRIENDS_ONLY' and exists(select 1 from public.friendships f where f.status='ACCEPTED' and
 ((f.requester_id=p_viewer and f.addressee_id=o.id) or (f.requester_id=o.id and f.addressee_id=p_viewer)))))
 and (s.audience='MEMBERS' or (s.audience='SELECTED' and p_viewer=any(s.recipients)) or
 (s.audience='FRIENDS' and exists(select 1 from public.friendships f where f.status='ACCEPTED' and
 ((f.requester_id=p_viewer and f.addressee_id=o.id) or (f.requester_id=o.id and f.addressee_id=p_viewer)))))
 )));
$$;
