-- Additive: no attendance registry, backfill, client grant or notification job.
-- Requires canonical Scene, Tonight Plans and start-time migrations.
begin;
alter table public.dating_ads add column scene_event_id uuid references public.scene_events(id) on delete set null;
create index dating_ads_scene_event on public.dating_ads(scene_event_id,starts_at) where scene_event_id is not null;

create function public.intimo_guard_scene_plan() returns trigger
language plpgsql security invoker set search_path='' as $$
declare event public.scene_events; expected_end timestamptz;
begin
 if new.scene_event_id is null then return new; end if;
 select * into event from public.scene_events where id=new.scene_event_id for share;
 if not found or event.status<>'PUBLISHED' or event.starts_at<=now() or event.starts_at>now()+interval '90 days' then
  raise exception 'Event unavailable for a company invitation';
 end if;
 expected_end:=least(coalesce(event.ends_at,event.starts_at+interval '3 hours'),event.starts_at+interval '12 hours');
 if expected_end<event.starts_at+interval '30 minutes' or new.starts_at<>event.starts_at or new.expires_at<>expected_end
  or new.area_id is distinct from event.area_id then raise exception 'Invitation must match the published event time and area'; end if;
 return new;
end $$;
revoke all on function public.intimo_guard_scene_plan() from public,anon,authenticated;
create trigger guard_scene_plan before insert or update of scene_event_id,starts_at,expires_at,area_id on public.dating_ads
 for each row execute function public.intimo_guard_scene_plan();

-- Cancel stale invitations when the organiser's listing is hidden/rescheduled
-- or deleted. Re-publishing never silently restores an old member invitation.
create function public.intimo_close_changed_scene_plans() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if tg_op='DELETE' then
  update public.dating_ads set status='closed' where scene_event_id=old.id and status='active';
 elsif new.status<>'PUBLISHED' or new.starts_at is distinct from old.starts_at or new.ends_at is distinct from old.ends_at or new.area_id is distinct from old.area_id then
  update public.dating_ads set status='closed' where scene_event_id=old.id and status='active';
 end if;
 return old;
end $$;
revoke all on function public.intimo_close_changed_scene_plans() from public,anon,authenticated;
create trigger close_changed_scene_plans after update of status,starts_at,ends_at,area_id on public.scene_events
 for each row execute function public.intimo_close_changed_scene_plans();
create trigger close_deleted_scene_plans before delete on public.scene_events
 for each row execute function public.intimo_close_changed_scene_plans();

-- Recheck on actual reply insertion too, closing the API-to-write race.
create function public.intimo_guard_scene_reply() returns trigger
language plpgsql security invoker set search_path='' as $$
declare plan public.dating_ads; event public.scene_events; event_id uuid;
begin
 if new.plan_id is null then return new; end if;
 select scene_event_id into event_id from public.dating_ads where id=new.plan_id;
 if event_id is null then return new; end if;
 select * into event from public.scene_events where id=event_id for share;
 select * into plan from public.dating_ads where id=new.plan_id for share;
 if event.id is null or event.status<>'PUBLISHED' or plan.status<>'active' or plan.expires_at<=now()
  or plan.author_id is distinct from new.receiver_id or plan.starts_at<>event.starts_at
  or plan.expires_at<>least(coalesce(event.ends_at,event.starts_at+interval '3 hours'),event.starts_at+interval '12 hours') then
  raise exception 'Event invitation is no longer available';
 end if;
 return new;
end $$;
revoke all on function public.intimo_guard_scene_reply() from public,anon,authenticated;
create trigger guard_scene_reply before insert on public.direct_messages
 for each row execute function public.intimo_guard_scene_reply();
commit;
