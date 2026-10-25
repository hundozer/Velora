-- Requires canonical interests, album_access_grants and durable unread outbox.
-- No backfill, scheduler change, new secret or client write grant.
-- Install schema before deploying RPC callers; old direct writes stay compatible.
begin;
alter table public.unread_email_outbox drop constraint unread_email_outbox_category_check;
alter table public.unread_email_outbox add constraint unread_email_outbox_category_check
 check(category in ('MESSAGE','PLAN_REPLY','INTEREST','PRIVATE_ACCESS'));

-- References only: never store names, photo URLs, desires or message text.
create table public.return_email_events (
 job_id uuid not null references public.unread_email_outbox(id) on delete cascade,
 peer_id uuid not null references public.profiles(id) on delete cascade,
 notification_id uuid not null references public.notifications(id) on delete cascade,
 kind text not null check(kind in ('MUTUAL_INTEREST','PRIVATE_ACCESS_REQUEST','PRIVATE_ACCESS_GRANTED')),
 source_at timestamptz not null,
 primary key(job_id,peer_id,kind)
);
create index return_email_events_notification on public.return_email_events(notification_id);
alter table public.return_email_events enable row level security;
alter table public.return_email_events force row level security;
revoke all on public.return_email_events from public,anon,authenticated;
grant select,insert,update,delete on public.return_email_events to service_role;

create function public.intimo_queue_return_event(p_profile uuid,p_category text,p_peer uuid,p_kind text,p_source_at timestamptz)
returns void language plpgsql security invoker set search_path='' as $$
declare job uuid; notice uuid; peer public.profiles;
begin
 if p_profile=p_peer or p_source_at is null then return; end if;
 select * into peer from public.profiles where id=p_peer and account_status='ACTIVE' and not is_demo and auth_id=id::text;
 if not found or not exists(select 1 from public.profiles where id=p_profile and account_status='ACTIVE' and not is_demo and auth_id=id::text)
  or exists(select 1 from public.user_blocks where (blocker_id=p_profile and blocked_profile_id=p_peer) or (blocker_id=p_peer and blocked_profile_id=p_profile)) then return; end if;
 insert into public.notifications(user_id,type,title,message,actor_name,actor_avatar,target_link,is_read)
 values(p_profile,p_kind,
  case p_kind when 'MUTUAL_INTEREST' then 'You''re both interested' when 'PRIVATE_ACCESS_REQUEST' then 'Photo access request' else 'Photo access granted' end,
  case p_kind when 'MUTUAL_INTEREST' then 'You and '||peer.display_name||' are both interested.' when 'PRIVATE_ACCESS_REQUEST' then peer.display_name||' asked to see your private photos.' else peer.display_name||' shared their private photos with you.' end,
  peer.display_name,peer.avatar_url,case when p_kind='PRIVATE_ACCESS_REQUEST' then '/me/private-photos' else '/profile/'||p_peer::text end,false)
 returning id into notice;
 insert into public.unread_email_outbox(profile_id,category) values(p_profile,p_category)
 on conflict(profile_id,category) where status in ('PENDING','PROCESSING')
 do update set due_at=public.unread_email_outbox.due_at returning id into job;
 insert into public.return_email_events(job_id,peer_id,notification_id,kind,source_at) values(job,p_peer,notice,p_kind,p_source_at)
 on conflict(job_id,peer_id,kind) do update set source_at=excluded.source_at,notification_id=excluded.notification_id;
end $$;
revoke all on function public.intimo_queue_return_event(uuid,text,uuid,text,timestamptz) from public,anon,authenticated,service_role;
grant execute on function public.intimo_queue_return_event(uuid,text,uuid,text,timestamptz) to service_role;

-- New application calls these transactions; old deployments keep their existing
-- direct writes until cutover. Installing this schema alone sends no new alerts.
create function public.intimo_save_interest(p_from uuid,p_to uuid) returns boolean
language plpgsql security invoker set search_path='' as $$
declare created timestamptz; formed_at timestamptz;
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(least(p_from::text,p_to::text)||':'||greatest(p_from::text,p_to::text),724103));
 insert into public.interests(from_id,to_id) values(p_from,p_to)
 on conflict(from_id,to_id) do nothing returning created_at into created;
 if not found then return false; end if;
 select greatest(created,i.created_at) into formed_at from public.interests i where i.from_id=p_to and i.to_id=p_from;
 if formed_at is not null then
  perform public.intimo_queue_return_event(least(p_from,p_to),'INTEREST',greatest(p_from,p_to),'MUTUAL_INTEREST',formed_at);
  perform public.intimo_queue_return_event(greatest(p_from,p_to),'INTEREST',least(p_from,p_to),'MUTUAL_INTEREST',formed_at);
 else
  -- Keep the existing in-app one-sided signal, without an email for every like.
  insert into public.notifications(user_id,type,title,message,actor_name,actor_avatar,target_link,is_read)
   select p_to,'INTEREST','Someone is interested',s.display_name||' is interested in you.',s.display_name,s.avatar_url,'/activity',false
   from public.profiles s join public.profiles recipient on recipient.id=p_to
   where s.id=p_from and s.account_status='ACTIVE' and recipient.account_status='ACTIVE' and not s.is_demo and not recipient.is_demo
    and not exists(select 1 from public.user_blocks b where (b.blocker_id=p_from and b.blocked_profile_id=p_to) or (b.blocker_id=p_to and b.blocked_profile_id=p_from));
 end if;
 return true;
end $$;
revoke all on function public.intimo_save_interest(uuid,uuid) from public,anon,authenticated;
grant execute on function public.intimo_save_interest(uuid,uuid) to service_role;

create function public.intimo_request_private_access(p_owner uuid,p_viewer uuid) returns boolean
language plpgsql security invoker set search_path='' as $$
declare previous public.album_access_grants; requested timestamptz:=clock_timestamp();
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_owner::text||':'||p_viewer::text,724104));
 select * into previous from public.album_access_grants where owner_id=p_owner and viewer_id=p_viewer for update;
 if found and (previous.status='REQUESTED' or
  (previous.status='GRANTED' and (previous.grant_type='UNTIL_REVOKED' or previous.expires_at>now())) or
  (previous.status='DENIED' and previous.decided_at>now()-interval '7 days')) then return false; end if;
 insert into public.album_access_grants(owner_id,viewer_id,status,grant_type,expires_at,requested_at,decided_at)
 values(p_owner,p_viewer,'REQUESTED',null,null,requested,null)
 on conflict(owner_id,viewer_id) do update set status='REQUESTED',grant_type=null,expires_at=null,requested_at=excluded.requested_at,decided_at=null;
 perform public.intimo_queue_return_event(p_owner,'PRIVATE_ACCESS',p_viewer,'PRIVATE_ACCESS_REQUEST',requested);
 return true;
end $$;
revoke all on function public.intimo_request_private_access(uuid,uuid) from public,anon,authenticated;
grant execute on function public.intimo_request_private_access(uuid,uuid) to service_role;

create function public.intimo_decide_private_access(p_owner uuid,p_viewer uuid,p_decision text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare previous public.album_access_grants; current public.album_access_grants; decided timestamptz:=clock_timestamp();
begin
 if p_decision not in ('GRANT','GRANT_ONCE','DENY','REVOKE') then raise exception 'Invalid private access decision'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_owner::text||':'||p_viewer::text,724104));
 select * into previous from public.album_access_grants where owner_id=p_owner and viewer_id=p_viewer for update;
 if not found then return null; end if;
 -- An identical grant is a no-op, preserving notification/read state and expiry.
 if previous.status='GRANTED' and ((p_decision='GRANT' and previous.grant_type='UNTIL_REVOKED') or
  (p_decision='GRANT_ONCE' and previous.grant_type='ONCE' and previous.expires_at>now())) then
  return to_jsonb(previous);
 end if;
 update public.album_access_grants set
  status=case p_decision when 'DENY' then 'DENIED' when 'REVOKE' then 'REVOKED' else 'GRANTED' end,
  grant_type=case p_decision when 'GRANT' then 'UNTIL_REVOKED' when 'GRANT_ONCE' then 'ONCE' else null end,
  expires_at=case when p_decision='GRANT_ONCE' then decided+interval '24 hours' else null end,decided_at=decided
 where owner_id=p_owner and viewer_id=p_viewer returning * into current;
 if current.status='GRANTED' then
  perform public.intimo_queue_return_event(p_viewer,'PRIVATE_ACCESS',p_owner,'PRIVATE_ACCESS_GRANTED',current.decided_at);
 end if;
 return to_jsonb(current);
end $$;
revoke all on function public.intimo_decide_private_access(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.intimo_decide_private_access(uuid,uuid,text) to service_role;

create function public.intimo_has_social_return_email(p_profile uuid,p_category text) returns boolean
language sql stable security invoker set search_path='' as $$
 select exists(
  select 1 from public.unread_email_outbox q
  join public.return_email_events e on e.job_id=q.id
  join public.notifications n on n.id=e.notification_id and not coalesce(n.is_read,false)
  join public.profiles peer on peer.id=e.peer_id
  where q.profile_id=p_profile and q.category=p_category and q.status in ('PENDING','PROCESSING')
   and peer.account_status='ACTIVE' and not peer.is_demo and peer.auth_id=peer.id::text
   and not exists(select 1 from public.user_blocks b where
    (b.blocker_id=p_profile and b.blocked_profile_id=e.peer_id) or
    (b.blocker_id=e.peer_id and b.blocked_profile_id=p_profile))
   and (
    (p_category='INTEREST' and e.kind='MUTUAL_INTEREST' and exists(
     select 1 from public.interests a join public.interests b on b.from_id=a.to_id and b.to_id=a.from_id
     where a.from_id=p_profile and a.to_id=e.peer_id and greatest(a.created_at,b.created_at)=e.source_at
    )) or
    (p_category='PRIVATE_ACCESS' and e.kind='PRIVATE_ACCESS_REQUEST' and exists(
     select 1 from public.album_access_grants g where g.owner_id=p_profile and g.viewer_id=e.peer_id
      and g.status='REQUESTED' and g.requested_at=e.source_at
    )) or
    (p_category='PRIVATE_ACCESS' and e.kind='PRIVATE_ACCESS_GRANTED' and exists(
     select 1 from public.album_access_grants g where g.owner_id=e.peer_id and g.viewer_id=p_profile
      and g.status='GRANTED' and g.decided_at=e.source_at
      and (g.grant_type='UNTIL_REVOKED' or (g.grant_type='ONCE' and g.expires_at>now()))
    ))
   )
 );
$$;
revoke all on function public.intimo_has_social_return_email(uuid,text) from public,anon,authenticated;
grant execute on function public.intimo_has_social_return_email(uuid,text) to service_role;

-- Keep the proven message eligibility behavior; the same claim/prepare/finish
-- RPCs now validate new categories against their current domain state.
create or replace function public.intimo_has_unread_email(p_profile uuid,p_category text) returns boolean
language plpgsql stable security invoker set search_path='' as $$
begin
 if p_category in ('INTEREST','PRIVATE_ACCESS') then
  return public.intimo_has_social_return_email(p_profile,p_category);
 end if;
 return exists (
  select 1 from public.direct_messages m
  join public.profiles s on s.id=m.sender_id
  where m.receiver_id=p_profile and not coalesce(m.is_opened,false) and m.status='SENT'
   and s.account_status='ACTIVE' and not s.is_demo
   and (case when m.plan_id is null then 'MESSAGE' else 'PLAN_REPLY' end)=p_category
   and not exists(select 1 from public.user_blocks b
    where (b.blocker_id=m.sender_id and b.blocked_profile_id=m.receiver_id)
       or (b.blocker_id=m.receiver_id and b.blocked_profile_id=m.sender_id))
 );
end $$;
revoke all on function public.intimo_has_unread_email(uuid,text) from public,anon,authenticated;
grant execute on function public.intimo_has_unread_email(uuid,text) to service_role;

-- Terminal delivery/cancellation removes relationship references immediately.
create function public.intimo_clear_return_email_events() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.status in ('SENT','CANCELLED','FAILED') then delete from public.return_email_events where job_id=new.id; end if;
 return new;
end $$;
revoke all on function public.intimo_clear_return_email_events() from public,anon,authenticated,service_role;
create trigger clear_return_email_events after update of status on public.unread_email_outbox
 for each row execute function public.intimo_clear_return_email_events();
commit;
