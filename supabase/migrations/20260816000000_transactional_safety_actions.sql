-- Transactional safety actions. Callable only through the server service role.
begin;
create or replace function public.intimo_create_report(
  p_reporter_id uuid, p_reported_user_id uuid, p_content_type text, p_content_id text,
  p_reason text, p_description text, p_priority text, p_status text
) returns jsonb language plpgsql set search_path = public as $$
declare v_case public.moderation_cases;
begin
  insert into public.moderation_cases(reporter_id,reported_user_id,content_type,content_id,reason,description,priority,status)
  values(p_reporter_id,p_reported_user_id,p_content_type,p_content_id,p_reason,p_description,p_priority,p_status) returning * into v_case;
  insert into public.moderation_events(case_id,actor_profile_id,action,from_status,to_status,reason)
  values(v_case.id,p_reporter_id,case when p_priority='CRITICAL' then 'CRITICAL_REPORT_ESCALATED' else 'REPORT_CREATED' end,null,p_status,p_reason);
  return jsonb_build_object('id',v_case.id,'status',v_case.status,'priority',v_case.priority,'created_at',v_case.created_at);
end $$;

create unique index if not exists idx_moderation_appeals_case_appellant on public.moderation_appeals(case_id,appellant_id);
create or replace function public.intimo_create_appeal(p_case_id uuid,p_appellant_id uuid,p_reason text)
returns jsonb language plpgsql set search_path = public as $$
declare v_case public.moderation_cases; v_appeal public.moderation_appeals;
begin
  select * into v_case from public.moderation_cases where id=p_case_id and reported_user_id=p_appellant_id for update;
  if not found or v_case.status not in ('RESOLVED','REJECTED') or v_case.appeal_status <> 'NONE' then raise exception 'case_not_eligible'; end if;
  insert into public.moderation_appeals(case_id,appellant_id,reason,status) values(p_case_id,p_appellant_id,p_reason,'OPEN') returning * into v_appeal;
  update public.moderation_cases set status='APPEALED',appeal_status='OPEN',updated_at=now() where id=p_case_id;
  insert into public.moderation_events(case_id,actor_profile_id,action,from_status,to_status,reason)
  values(p_case_id,p_appellant_id,'APPEAL_CREATED',v_case.status,'APPEALED',p_reason);
  return jsonb_build_object('id',v_appeal.id,'status',v_appeal.status,'created_at',v_appeal.created_at);
end $$;
revoke all on function public.intimo_create_report(uuid,uuid,text,text,text,text,text,text) from public,anon,authenticated;
revoke all on function public.intimo_create_appeal(uuid,uuid,text) from public,anon,authenticated;
commit;
-- Rollback: drop both functions and idx_moderation_appeals_case_appellant only
-- after confirming no duplicate appeal rows are needed for evidence.
