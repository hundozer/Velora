-- Manual production ledger repair; NOT an application migration.
-- Target: bkdyjdbmtucqvgebqadp, only after explicit owner approval.
-- Preserve the complete historical receipt, including SQL, without executing it.
-- After any ambiguous response, inspect both archive and ledger before retrying.
begin;

create temporary table intimo_ledger_repair_baseline on commit drop as
select
  (select md5(jsonb_agg(to_jsonb(m) order by version)::text)
     from supabase_migrations.schema_migrations m where version <> '20260922033815') as canonical_ledger,
  (select md5(jsonb_agg(to_jsonb(p) order by id)::text) from public.profiles p) as profiles,
  (select md5(jsonb_agg(to_jsonb(m) order by id)::text) from public.media_objects m) as media,
  (select md5(jsonb_agg(to_jsonb(p) order by policyname)::text) from pg_policies p
     where schemaname='public' and tablename='direct_messages') as message_policies;

do $$
begin
  if not exists (
    select 1 from supabase_migrations.schema_migrations
    where version='20260922033815' and name='001_initial_schema'
      and array_length(statements,1)=1
      and md5(array_to_string(statements,E'\n'))='09afadcde71d6378ece68b69ac5811b4'
  ) then raise exception 'Expected historical bootstrap receipt is absent or changed'; end if;
  if to_regclass('intimo_migration_audit.retired_migration_receipts') is not null then
    raise exception 'Archive already exists; inspect previous execution before retrying';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public'
    and table_name='profiles' and column_name='account_status')
    or (select count(*) from supabase_migrations.schema_migrations where version in
      ('20260805','20260806','20261019','20261104')) <> 4
    or (select md5(statements[1]) from supabase_migrations.schema_migrations where version='20261104')
      is distinct from '1cd73751c6f9ce761e65999956296e0b'
    or md5(pg_get_functiondef('public.intimo_can_read_message(uuid,uuid)'::regprocedure))
      <> 'b5410de5cebab3460e5fe0566ca59367'
    or not exists (select 1 from pg_policies where schemaname='public'
      and tablename='direct_messages' and policyname='member_message_safety' and permissive='RESTRICTIVE')
  then raise exception 'Canonical schema and safety-policy preconditions failed'; end if;
end $$;

create schema if not exists intimo_migration_audit;
revoke all on schema intimo_migration_audit from public, anon, authenticated;
create table intimo_migration_audit.retired_migration_receipts (
  version text primary key,
  receipt jsonb not null,
  reason text not null,
  archived_at timestamptz not null default now()
);
alter table intimo_migration_audit.retired_migration_receipts enable row level security;
revoke all on table intimo_migration_audit.retired_migration_receipts from public, anon, authenticated, service_role;

insert into intimo_migration_audit.retired_migration_receipts (version,receipt,reason)
select version,to_jsonb(m),'Historical pre-canonical bootstrap; superseded by 20260805 and canonical schema. Archived to reconcile CLI history; no schema rollback or replay.'
from supabase_migrations.schema_migrations m where version='20260922033815';
delete from supabase_migrations.schema_migrations where version='20260922033815';

do $$
begin
  if exists (select 1 from supabase_migrations.schema_migrations where version='20260922033815')
    or (select count(*) from intimo_migration_audit.retired_migration_receipts) <> 1
    or not exists (select 1 from intimo_migration_audit.retired_migration_receipts
      where version='20260922033815' and receipt->>'name'='001_initial_schema'
        and md5(receipt->'statements'->>0)='09afadcde71d6378ece68b69ac5811b4')
    or (select canonical_ledger from intimo_ledger_repair_baseline) is distinct from
      (select md5(jsonb_agg(to_jsonb(m) order by version)::text) from supabase_migrations.schema_migrations m)
    or (select profiles from intimo_ledger_repair_baseline) is distinct from
      (select md5(jsonb_agg(to_jsonb(p) order by id)::text) from public.profiles p)
    or (select media from intimo_ledger_repair_baseline) is distinct from
      (select md5(jsonb_agg(to_jsonb(m) order by id)::text) from public.media_objects m)
    or (select message_policies from intimo_ledger_repair_baseline) is distinct from
      (select md5(jsonb_agg(to_jsonb(p) order by policyname)::text) from pg_policies p
       where schemaname='public' and tablename='direct_messages')
    or has_table_privilege('anon','intimo_migration_audit.retired_migration_receipts','SELECT')
    or has_table_privilege('authenticated','intimo_migration_audit.retired_migration_receipts','SELECT')
    or has_table_privilege('service_role','intimo_migration_audit.retired_migration_receipts','SELECT')
    or has_schema_privilege('anon','intimo_migration_audit','USAGE')
    or has_schema_privilege('authenticated','intimo_migration_audit','USAGE')
  then raise exception 'Ledger archival preservation/access postconditions failed'; end if;
end $$;

commit;
