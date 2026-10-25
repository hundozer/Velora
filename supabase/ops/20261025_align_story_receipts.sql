-- Run only AFTER the three reviewed story migrations have actually succeeded.
-- Official tool receipt timestamps may differ from the canonical source versions.
-- Preserve every other ledger field; never insert a receipt or mark skipped SQL applied.
begin;
set local lock_timeout='5s';
lock table supabase_migrations.schema_migrations in exclusive mode;
do $align$
declare item record; actual record; before_metadata jsonb; after_metadata jsonb;
begin
 select jsonb_agg(to_jsonb(m)-'version' order by name,version) into before_metadata from supabase_migrations.schema_migrations m;
 for item in select * from (values
 ('private_photo_stories','20261025034408','a2f5d19dd1ce62ccd5869be54ec1f06b'),
 ('story_author_adult_guard','20261025042415','e3f65987526523a8677d63b7615bc753'),
 ('story_cleanup_worker','20261025043422','a0b0ea2cbfacad5cf1700a791123074b')
 ) as expected(name,version,sql_md5)
 loop
  if (select count(*) from supabase_migrations.schema_migrations where name=item.name)<>1 then raise exception 'Missing or duplicate story migration %',item.name; end if;
  select version,md5(array_to_string(statements,E'\n')) as sql_md5 into actual from supabase_migrations.schema_migrations where name=item.name;
  if actual.sql_md5 is distinct from item.sql_md5 then raise exception 'Story SQL mismatch: %',item.name; end if;
  if actual.version<>item.version then
   if exists(select 1 from supabase_migrations.schema_migrations where version=item.version) then raise exception 'Receipt destination collision'; end if;
   update supabase_migrations.schema_migrations set version=item.version where name=item.name and version=actual.version;
  end if;
 end loop;
 select jsonb_agg(to_jsonb(m)-'version' order by name,version) into after_metadata from supabase_migrations.schema_migrations m;
 if before_metadata is distinct from after_metadata then raise exception 'Non-version receipt metadata changed'; end if;
end $align$;
commit;
