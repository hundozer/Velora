begin;
alter table public.member_stories add column plan_id uuid references public.dating_ads(id) on delete set null;
create index member_stories_plan on public.member_stories(plan_id) where plan_id is not null;

-- Keep publication and linkage atomic; callers cannot attach somebody else's plan.
create function public.intimo_publish_plan_story(p_owner uuid,p_media uuid,p_caption text,p_audience text,p_recipients uuid[],p_plan uuid)
returns uuid language plpgsql security invoker set search_path='' as $$
declare result uuid;
begin
 perform 1 from public.dating_ads where id=p_plan and author_id=p_owner
 and status='active' and moderation_status<>'REJECTED' and expires_at>now() for share;
 if not found then raise exception 'Invitation unavailable'; end if;
 result:=public.intimo_publish_story(p_owner,p_media,p_caption,p_audience,p_recipients);
 update public.member_stories set plan_id=p_plan where id=result;
 return result;
end $$;
revoke all on function public.intimo_publish_plan_story(uuid,uuid,text,text,uuid[],uuid) from public,anon,authenticated;
grant execute on function public.intimo_publish_plan_story(uuid,uuid,text,text,uuid[],uuid) to service_role;
commit;
