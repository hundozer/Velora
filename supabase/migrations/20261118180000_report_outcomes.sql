-- FM-07: report outcomes, statements of reasons and appeals (EU DSA Art. 16, 17 and 20).
-- Additive: new nullable columns on moderation_cases, ALBUM accepted as a reported content type
-- (the report form already offered it), appeals open to the reporter as well as the reported
-- member, and one transactional function to decide an appeal. No existing row changes.
--
-- ROLLBACK:
--   drop function if exists public.intimo_decide_appeal(uuid, uuid, text, text, text);
--   -- restore intimo_create_appeal from 20260816000000_transactional_safety_actions.sql
--   alter table public.moderation_cases
--     drop column if exists affected_notified_at, drop column if exists reporter_notified_at,
--     drop column if exists member_statement, drop column if exists policy_ground,
--     drop column if exists action_taken;
--   -- only if no ALBUM case exists:
--   alter table public.moderation_cases drop constraint moderation_cases_content_type_check,
--     add constraint moderation_cases_content_type_check check (content_type in
--     ('PROFILE','PHOTO','VIDEO','MESSAGE','POST','COMMENT','COMMUNITY','EVENT','LIVESTREAM'));

alter table public.moderation_cases
  drop constraint if exists moderation_cases_content_type_check,
  add constraint moderation_cases_content_type_check check (content_type in
    ('PROFILE','PHOTO','ALBUM','VIDEO','MESSAGE','POST','COMMENT','COMMUNITY','EVENT','LIVESTREAM'));

alter table public.moderation_cases
  add column if not exists action_taken text check (action_taken is null or action_taken in
    ('NO_ACTION','WARNING','CONTENT_REMOVED','FEATURE_RESTRICTED','ACCOUNT_SUSPENDED','ACCOUNT_BANNED')),
  add column if not exists policy_ground text check (policy_ground is null or policy_ground in
    ('MINORS','CONSENT','HARASSMENT','IMPERSONATION','SCAM','PRIVACY','ILLEGAL','COPYRIGHT','SPAM','OTHER')),
  -- Written for the reported member: the facts and reasoning, never the reporter's identity.
  add column if not exists member_statement text check (member_statement is null or char_length(member_statement) between 20 and 2000),
  add column if not exists reporter_notified_at timestamptz,
  add column if not exists affected_notified_at timestamptz;

-- Either side of a decided case may ask for one review: the reported member only when action
-- was taken against them, the reporter for any outcome.
create or replace function public.intimo_create_appeal(p_case_id uuid, p_appellant_id uuid, p_reason text)
returns jsonb language plpgsql set search_path = public as $$
declare v_case public.moderation_cases; v_appeal public.moderation_appeals;
begin
  select * into v_case from public.moderation_cases where id = p_case_id for update;
  if not found or v_case.status not in ('RESOLVED','REJECTED') or v_case.appeal_status <> 'NONE' then raise exception 'case_not_eligible'; end if;
  if not (
    (v_case.reported_user_id = p_appellant_id and coalesce(v_case.action_taken, 'NO_ACTION') <> 'NO_ACTION')
    or v_case.reporter_id = p_appellant_id
  ) then raise exception 'case_not_eligible'; end if;
  insert into public.moderation_appeals(case_id, appellant_id, reason, status) values (p_case_id, p_appellant_id, p_reason, 'OPEN') returning * into v_appeal;
  update public.moderation_cases set status = 'APPEALED', appeal_status = 'OPEN', updated_at = now() where id = p_case_id;
  insert into public.moderation_events(case_id, actor_profile_id, action, from_status, to_status, reason)
  values (p_case_id, p_appellant_id, 'APPEAL_CREATED', v_case.status, 'APPEALED', p_reason);
  return jsonb_build_object('id', v_appeal.id, 'status', v_appeal.status, 'created_at', v_appeal.created_at);
end $$;

-- Decides the open appeal on a case in one transaction. p_member_statement is written for the
-- appellant; p_internal_reason stays in the moderation history.
create or replace function public.intimo_decide_appeal(p_case_id uuid, p_reviewer_id uuid, p_outcome text, p_member_statement text, p_internal_reason text)
returns jsonb language plpgsql set search_path = public as $$
declare v_case public.moderation_cases; v_appeal public.moderation_appeals; v_status text;
begin
  if p_outcome not in ('UPHELD','OVERTURNED','PARTIALLY_OVERTURNED') then raise exception 'invalid_outcome'; end if;
  select * into v_case from public.moderation_cases where id = p_case_id for update;
  if not found or v_case.status <> 'APPEALED' then raise exception 'appeal_not_open'; end if;
  select * into v_appeal from public.moderation_appeals where case_id = p_case_id and status in ('OPEN','UNDER_REVIEW') order by created_at desc limit 1 for update;
  if not found then raise exception 'appeal_not_open'; end if;
  update public.moderation_appeals set status = p_outcome, assigned_reviewer = p_reviewer_id, decision_reason = p_member_statement, decided_at = now() where id = v_appeal.id;
  -- The case returns to its decided state; the appeal outcome records whether it still stands.
  v_status := case when coalesce(v_case.action_taken, 'NO_ACTION') = 'NO_ACTION' then 'REJECTED' else 'RESOLVED' end;
  update public.moderation_cases set status = v_status, appeal_status = p_outcome, updated_at = now() where id = p_case_id;
  insert into public.moderation_events(case_id, actor_profile_id, action, from_status, to_status, reason)
  values (p_case_id, p_reviewer_id, 'APPEAL_' || p_outcome, 'APPEALED', v_status, p_internal_reason);
  return jsonb_build_object('appeal_id', v_appeal.id, 'appellant_id', v_appeal.appellant_id, 'outcome', p_outcome, 'case_status', v_status);
end $$;

revoke all on function public.intimo_create_appeal(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.intimo_decide_appeal(uuid, uuid, text, text, text) from public, anon, authenticated;
