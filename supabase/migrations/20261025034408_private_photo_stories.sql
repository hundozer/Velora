-- Photo-only stories. Member APIs use service-only RPCs; no direct client access.
begin;
create table public.member_stories (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references public.profiles(id) on delete cascade,
 media_id uuid not null unique references public.media_objects(id) on delete cascade,
 caption text not null default '' check(length(caption)<=240),
 audience text not null check(audience in ('MEMBERS','FRIENDS','SELECTED')),
 recipients uuid[] not null default '{}' check(cardinality(recipients)<=20),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '24 hours',
 deleted_at timestamptz,
 check(expires_at=created_at+interval '24 hours'),
 check((audience='SELECTED' and cardinality(recipients)>0) or (audience<>'SELECTED' and cardinality(recipients)=0))
);
create index member_stories_live on public.member_stories(owner_id,expires_at) where deleted_at is null;
create table public.story_views (
 story_id uuid not null references public.member_stories(id) on delete cascade,
 viewer_id uuid not null references public.profiles(id) on delete cascade,
 viewed_at timestamptz not null default now(),
 primary key(story_id,viewer_id)
);
alter table public.member_stories enable row level security;
alter table public.story_views enable row level security;
revoke all on public.member_stories,public.story_views from public,anon,authenticated;
grant all on public.member_stories,public.story_views to service_role;

create function public.intimo_story_visible(p_viewer uuid,p_story uuid) returns boolean
language sql stable security invoker set search_path='' as $$
 select exists(
 select 1 from public.member_stories s
 join public.profiles o on o.id=s.owner_id
 join public.profiles v on v.id=p_viewer
 join public.media_objects m on m.id=s.media_id and m.owner_id=s.owner_id
 where s.id=p_story and s.deleted_at is null and s.expires_at>now()
 and o.account_status='ACTIVE' and v.account_status='ACTIVE'
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
create function public.intimo_story_list(p_viewer uuid,p_owners uuid[] default null)
returns table(id uuid,owner_id uuid,media_id uuid,caption text,audience text,created_at timestamptz,expires_at timestamptz,viewed boolean)
language sql stable security invoker set search_path='' as $$
 select s.id,s.owner_id,s.media_id,s.caption,s.audience,s.created_at,s.expires_at,
 exists(select 1 from public.story_views v where v.story_id=s.id and v.viewer_id=p_viewer)
 from public.member_stories s where s.deleted_at is null and s.expires_at>now()
 and (p_owners is null or s.owner_id=any(p_owners))
 and public.intimo_story_visible(p_viewer,s.id)
 order by s.created_at desc,s.id limit 500;
$$;
create function public.intimo_publish_story(p_owner uuid,p_media uuid,p_caption text,p_audience text,p_recipients uuid[])
returns uuid language plpgsql security invoker set search_path='' as $$
declare result uuid; m public.media_objects;
begin
 perform 1 from public.profiles where id=p_owner and account_status='ACTIVE'
 and age_verification_status in ('AGE_DECLARED','AGE_VERIFIED') and auth_id is not null for update;
 if not found then raise exception 'Member unavailable'; end if;
 if (select count(*) from public.member_stories where owner_id=p_owner and deleted_at is null and expires_at>now())>=10 then raise exception 'Ten active stories maximum'; end if;
 select * into m from public.media_objects where id=p_media and owner_id=p_owner for update;
 if not found or m.category is distinct from 'STORY' or m.visibility<>'PRIVATE'
 or m.media_type<>'IMAGE' or m.content_rating<>'NON_EXPLICIT' or m.upload_status<>'AVAILABLE'
 or m.processing_status<>'READY' or m.moderation_status in ('REJECTED','HIDDEN','REMOVED') then raise exception 'Story photo unavailable'; end if;
 update public.media_objects set description=p_caption,moderation_status='PENDING_REVIEW' where id=p_media;
 insert into public.member_stories(owner_id,media_id,caption,audience,recipients)
 values(p_owner,p_media,p_caption,p_audience,p_recipients) returning id into result;
 return result;
end $$;
create function public.intimo_view_story(p_viewer uuid,p_story uuid) returns boolean
language plpgsql security invoker set search_path='' as $$
begin
 if not public.intimo_story_visible(p_viewer,p_story) then return false; end if;
 insert into public.story_views(story_id,viewer_id) values(p_story,p_viewer) on conflict do nothing;
 return true;
end $$;

-- A story object can never be repurposed as a normal album/chat/profile photo.
create function public.intimo_guard_story_media() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if tg_op='UPDATE' then
  if (old.category='STORY' or new.category='STORY') and
  (old.category is distinct from new.category or old.owner_id is distinct from new.owner_id) then
   raise exception 'Story media cannot be repurposed';
  end if;
 end if;
 if new.category='STORY' and (new.visibility<>'PRIVATE' or new.media_type<>'IMAGE'
 or new.content_rating<>'NON_EXPLICIT' or new.mime_type not in ('image/jpeg','image/png','image/webp')) then
  raise exception 'Story media must be a private non-explicit photo';
 end if;
 return new;
end $$;
create trigger guard_story_media before insert or update on public.media_objects for each row execute function public.intimo_guard_story_media();
revoke all on function public.intimo_story_visible(uuid,uuid),public.intimo_story_list(uuid,uuid[]),
 public.intimo_publish_story(uuid,uuid,text,text,uuid[]),public.intimo_view_story(uuid,uuid),
 public.intimo_guard_story_media() from public,anon,authenticated;
grant execute on function public.intimo_story_visible(uuid,uuid),public.intimo_story_list(uuid,uuid[]),
 public.intimo_publish_story(uuid,uuid,text,text,uuid[]),public.intimo_view_story(uuid,uuid),
 public.intimo_guard_story_media() to service_role;
commit;
