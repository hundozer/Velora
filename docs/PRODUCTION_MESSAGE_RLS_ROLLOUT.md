# Production message-read safety migration: approval pending

Proposed target: Supabase production `bkdyjdbmtucqvgebqadp` only. No production SQL has been executed by this recovery. The owner explicitly required separate production authorization; merged PRs and staging configuration are not that authorization.

Exact source: `supabase/migrations/20261104_block_aware_message_reads.sql` on merged main `0ffcb84b1be72f05d7725b941126a02a0d121235`.

SHA-256: `cc428966e904b3116dc31153fb492e0c28561c92b7ee4927f8838e911f88201b`.

The transaction adds/replaces `intimo_can_read_message(uuid,uuid)` and adds the restrictive `member_message_safety` SELECT policy. The helper checks the current uid is a participant, both profiles are ACTIVE and neither participant has blocked the other. It uses SECURITY DEFINER solely to see incoming blocks hidden by the existing own-block policy, with an empty search path and no anonymous/PUBLIC execution grant. Existing participant-read policy and member write revocations remain in place. No profile, message, relationship, media or other member row is modified.

## Preconditions

- Recheck actual production ledger, policy/helper presence and grants immediately before applying; stop on unexpected drift.
- Review the final staging evidence in `BETA_READINESS_2026-10-19.md`. SQL-role, actual member REST and live subscription results must be described separately; do not infer any unrun test passed.
- Obtain explicit approval for this exact production change. Do not bundle retention, admission, admin, other schema work or destructive fixtures.

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
