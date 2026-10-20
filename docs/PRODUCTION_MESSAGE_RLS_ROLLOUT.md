# Production message-read safety migration: approved, connector blocked

Approved target: Supabase production `bkdyjdbmtucqvgebqadp` only. No production SQL has been executed by this recovery. The owner explicitly approved this exact migration on 20 October 2026. Merged PRs and staging configuration were not used as authorization.

Exact source: `supabase/migrations/20261104_block_aware_message_reads.sql` on merged main `0ffcb84b1be72f05d7725b941126a02a0d121235`.

SHA-256: `cc428966e904b3116dc31153fb492e0c28561c92b7ee4927f8838e911f88201b`.

The transaction adds/replaces `intimo_can_read_message(uuid,uuid)` and adds the restrictive `member_message_safety` SELECT policy. The helper checks the current uid is a participant, both profiles are ACTIVE and neither participant has blocked the other. It uses SECURITY DEFINER solely to see incoming blocks hidden by the existing own-block policy, with an empty search path and no anonymous/PUBLIC execution grant. Existing participant-read policy and member write revocations remain in place. No profile, message, relationship, media or other member row is modified.

## Current execution status

20 October 2026 production attempt: owner explicitly approved only canonical `20261104_block_aware_message_reads.sql`. Source on authoritative main `0ffcb84b1be72f05d7725b941126a02a0d121235` still matches SHA-256 `cc428966e904b3116dc31153fb492e0c28561c92b7ee4927f8838e911f88201b`. Two `apply_migration` calls returned `Invalid or expired requestState`; after each, `execute_sql` independently confirmed no canonical/wrapper ledger receipt, no helper and no restrictive policy. No third unchanged retry. Production remains at profiles1/Auth1/media4/messages0, original participant policy and authenticated SELECT-only grant; no member fixture or member-data write occurred. Vercel production `dpl_GDAAJj42WEomuYqiVqnd8NjTENp4` remains READY at main `0ffcb84`. Migration approval is granted; execution is blocked by the connector. No Supabase CLI is installed. Dashboard SQL editor is the prepared fallback, pending permission to use Browser after repeated connector failure.

## Preconditions

- Recheck actual production ledger, policy/helper presence and grants immediately before applying; stop on unexpected drift.
- Review the final staging evidence in `BETA_READINESS_2026-10-19.md`. SQL-role, actual member REST and live subscription results must be described separately; do not infer any unrun test passed.
- Explicit approval for this exact production change was received on 20 October 2026. Do not bundle retention, admission, admin, other schema work or destructive fixtures.

## Apply after approval

Execute the exact canonical SQL with normal migration bookkeeping. Preserve both the genuinely executed canonical version `20261104` and the management tool's generated receipt, as documented for staging in `supabase/APPLIED.md`. Do not claim an applied row before execution, overwrite a different migration receipt, or blindly replay after an ambiguous error.

## Verify without production fixtures

Read-only checks:

```sql
select version, name from supabase_migrations.schema_migrations
where version='20261104' or name like '%block_aware_message%';
select policyname, permissive, roles, cmd, qual
from pg_policies where schemaname='public' and tablename='direct_messages';
select pg_get_functiondef('public.intimo_can_read_message(uuid,uuid)'::regprocedure);
select has_function_privilege('anon','public.intimo_can_read_message(uuid,uuid)','EXECUTE') as anon_execute,
       has_function_privilege('authenticated','public.intimo_can_read_message(uuid,uuid)','EXECUTE') as member_execute;
select grantee, privilege_type from information_schema.role_table_grants
where table_schema='public' and table_name='direct_messages'
  and grantee in ('anon','authenticated');
```

Expected: restrictive SELECT safety policy plus original participant policy; no anon execution; authenticated helper execution; authenticated SELECT only and no anon table access. Confirm RLS is enabled, function/ACL definitions match the staged change, and production's homepage/public DB response/anonymous member denial remain healthy. Record exact application deployment SHA and database receipt. Do not create messages/accounts or run the staging SQL fixture in production.

Rollback is the two DROP statements documented in the migration header. It removes the additional safety predicate and reopens the known post-block direct-read gap; do not roll back merely to silence a deliberate SECURITY DEFINER advisor warning. Any rollback requires its own concrete reason and authorization.

This migration does not establish beta readiness by itself. Email confirmation/delivery, controlled admission, moderator operation and scheduled erasure remain distinct acceptance gates.

## Prepared SQL editor fallback

The transaction below executes the approved canonical schema statements and records the actually executed canonical source in the same transaction. A state guard refuses unexpected existing objects/history. It modifies no member rows. This fallback has **not been executed**. A successful dashboard execution will not generate a management-wrapper receipt; record only the canonical receipt that really exists, never fabricate a wrapper. Inspect ledger/objects before any retry after an ambiguous response.

```sql
-- Tighten direct Supabase REST/Realtime reads, not just the application API.
-- Apply and verify on isolated staging first. No data or existing policy is removed.
-- Rollback: drop policy member_message_safety on public.direct_messages;
--           drop function public.intimo_can_read_message(uuid, uuid);
begin;
select pg_advisory_xact_lock(20261104);
do $preflight$ begin if exists(select 1 from supabase_migrations.schema_migrations where version='20261104') or to_regprocedure('public.intimo_can_read_message(uuid,uuid)') is not null or exists(select 1 from pg_policies where schemaname='public' and tablename='direct_messages' and policyname='member_message_safety') then raise exception 'Production migration state changed; inspect before applying'; end if; end $preflight$;

-- The definer reads both directions of a block: member_read_own_blocks exposes
-- only the viewer's outgoing blocks, so an invoker function would miss a peer's.
-- The function returns only a decision and always checks the authenticated uid;
-- callers cannot use arbitrary participant IDs to inspect other conversations.
create or replace function public.intimo_can_read_message(p_sender uuid, p_receiver uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and (select auth.uid()) in (p_sender, p_receiver)
    and exists (select 1 from public.profiles p where p.id = p_sender and p.account_status = 'ACTIVE')
    and exists (select 1 from public.profiles p where p.id = p_receiver and p.account_status = 'ACTIVE')
    and not exists (
      select 1 from public.user_blocks b
      where (b.blocker_id = p_sender and b.blocked_profile_id = p_receiver)
         or (b.blocker_id = p_receiver and b.blocked_profile_id = p_sender)
    );
$$;

revoke all on function public.intimo_can_read_message(uuid, uuid) from public, anon;
grant execute on function public.intimo_can_read_message(uuid, uuid) to authenticated;

-- Restrictive policies are ANDed with existing/future permissive policies.
-- Keep the existing owner-scoped read policy and client write revocations.
drop policy if exists member_message_safety on public.direct_messages;
create policy member_message_safety on public.direct_messages
  as restrictive for select to authenticated
  using (public.intimo_can_read_message(sender_id, receiver_id));

insert into supabase_migrations.schema_migrations(version,name,statements) values ('20261104','block_aware_message_reads',array[$canonical_20261104$-- Tighten direct Supabase REST/Realtime reads, not just the application API.
-- Apply and verify on isolated staging first. No data or existing policy is removed.
-- Rollback: drop policy member_message_safety on public.direct_messages;
--           drop function public.intimo_can_read_message(uuid, uuid);
begin;

-- The definer reads both directions of a block: member_read_own_blocks exposes
-- only the viewer's outgoing blocks, so an invoker function would miss a peer's.
-- The function returns only a decision and always checks the authenticated uid;
-- callers cannot use arbitrary participant IDs to inspect other conversations.
create or replace function public.intimo_can_read_message(p_sender uuid, p_receiver uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and (select auth.uid()) in (p_sender, p_receiver)
    and exists (select 1 from public.profiles p where p.id = p_sender and p.account_status = 'ACTIVE')
    and exists (select 1 from public.profiles p where p.id = p_receiver and p.account_status = 'ACTIVE')
    and not exists (
      select 1 from public.user_blocks b
      where (b.blocker_id = p_sender and b.blocked_profile_id = p_receiver)
         or (b.blocker_id = p_receiver and b.blocked_profile_id = p_sender)
    );
$$;

revoke all on function public.intimo_can_read_message(uuid, uuid) from public, anon;
grant execute on function public.intimo_can_read_message(uuid, uuid) to authenticated;

-- Restrictive policies are ANDed with existing/future permissive policies.
-- Keep the existing owner-scoped read policy and client write revocations.
drop policy if exists member_message_safety on public.direct_messages;
create policy member_message_safety on public.direct_messages
  as restrictive for select to authenticated
  using (public.intimo_can_read_message(sender_id, receiver_id));

commit;
$canonical_20261104$]);
commit;
```
