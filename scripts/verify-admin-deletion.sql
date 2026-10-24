-- Staging only. Transactional fixtures, no Auth users or stored files created.
begin;
set local role service_role;
do $$
declare
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid(); m uuid := gen_random_uuid();
begin
  perform set_config('intimo.qa_member_a', a::text, true);
  perform set_config('intimo.qa_member_b', b::text, true);
  perform set_config('intimo.qa_message', m::text, true);
  insert into public.profiles(id,auth_id,email,account_status,account_lifecycle_status)
    values (a,a::text,'qa-admin-deletion-'||a||'@invalid.intimo.live','ACTIVE','ACTIVE'),
           (b,b::text,'qa-admin-deletion-'||b||'@invalid.intimo.live','ACTIVE','ACTIVE');
  insert into public.direct_messages(id,conversation_id,sender_id,receiver_id,sender_name,content)
    values(m,'qa-admin-deletion-'||m,a,b,'Synthetic member','Rollback-only deletion policy check');
  insert into public.admin_action_events(actor_profile_id,actor_role,action,category,resource_type,resource_id,reason)
    values(a,'SUPER_ADMIN','ADMIN_USER_DELETION_REQUESTED','PRIVACY_DELETION','USER',b::text,'Rollback-only synthetic check');
  insert into public.privacy_requests(id,profile_id,request_type,status,requested_at,assigned_admin_id,notes)
    values(b,b,'DELETION','IN_PROGRESS',now(),a,'Rollback-only synthetic check') on conflict(id) do nothing;
  insert into public.privacy_requests(id,profile_id,request_type,status,requested_at,assigned_admin_id,notes)
    values(b,b,'DELETION','IN_PROGRESS',now(),a,'Must not overwrite original request') on conflict(id) do nothing;
  if (select notes from public.privacy_requests where id=b) <> 'Rollback-only synthetic check' then raise exception 'Deletion request history overwritten'; end if;
end $$;
reset role;
set local role authenticated;
do $$
declare n integer;
begin
  perform set_config('request.jwt.claim.sub',current_setting('intimo.qa_member_a'),true);
  select count(*) into n from public.direct_messages where id=current_setting('intimo.qa_message')::uuid;
  if n <> 1 then raise exception 'Active participant baseline failed'; end if;
  begin
    update public.profiles set account_status='DEACTIVATED' where id=current_setting('intimo.qa_member_a')::uuid;
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'Direct member status write was allowed'; end if;
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
set local role service_role;
update public.profiles set account_status='DELETION_REQUESTED',account_lifecycle_status='DELETION_REQUESTED',deletion_requested_at=now(),public_profile_visibility=false,profile_visibility='PRIVATE',allow_direct_messages=false,discovery_disabled=true,messaging_disabled=true,media_uploads_disabled=true where id=current_setting('intimo.qa_member_b')::uuid and account_lifecycle_status='ACTIVE';
update public.profiles set account_status='DEACTIVATED',account_lifecycle_status='DEACTIVATED',deactivated_at=now() where id=current_setting('intimo.qa_member_b')::uuid and account_lifecycle_status='DELETION_REQUESTED';
reset role;
set local role authenticated;
do $$
declare n integer;
begin
  perform set_config('request.jwt.claim.sub',current_setting('intimo.qa_member_a'),true);
  select count(*) into n from public.direct_messages where id=current_setting('intimo.qa_message')::uuid;
  if n <> 0 then raise exception 'Active peer can still read deactivated member messages'; end if;
  perform set_config('request.jwt.claim.sub',current_setting('intimo.qa_member_b'),true);
  select count(*) into n from public.direct_messages where id=current_setting('intimo.qa_message')::uuid;
  if n <> 0 then raise exception 'Deactivated participant can still read messages'; end if;
end $$;
reset role;
rollback;
