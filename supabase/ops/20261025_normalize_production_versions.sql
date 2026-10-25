-- Operational history repair only; never put this file in migrations/.
-- Expected full ledger is pinned. No schema SQL is executed or marked applied.
begin;
set local lock_timeout='5s';
lock table supabase_migrations.schema_migrations in exclusive mode;
do $repair$
declare
 expected jsonb := '[{"version":"20260805","name":"drop_legacy_bootstrap","sql_md5":null},{"version":"20260806","name":"canonical_base_schema","sql_md5":null},{"version":"20260807","name":"lock_down_auth0_boundary","sql_md5":null},{"version":"20260808","name":"free_mvp_privacy_foundation","sql_md5":null},{"version":"20260809","name":"safety_moderation_foundation","sql_md5":null},{"version":"20260810","name":"critical_compliance_controls","sql_md5":null},{"version":"20260811","name":"admin_command_center","sql_md5":null},{"version":"20260812","name":"super_admin_elevation","sql_md5":null},{"version":"20260813","name":"internal_admin_mfa","sql_md5":null},{"version":"20260814","name":"public_community_content","sql_md5":null},{"version":"20260815","name":"retention_execution","sql_md5":null},{"version":"20260816","name":"transactional_safety_actions","sql_md5":null},{"version":"20260817","name":"canonical_media_albums","sql_md5":null},{"version":"20260818","name":"transactional_blocking","sql_md5":null},{"version":"20260819","name":"demo_content_marker","sql_md5":null},{"version":"20260820","name":"mutual_friendships","sql_md5":null},{"version":"20260821","name":"reconcile_canonical_media_schema","sql_md5":null},{"version":"20260822","name":"album_audience_and_interaction_rules","sql_md5":null},{"version":"20260823","name":"explicit_media_and_photo_verification","sql_md5":null},{"version":"20261017","name":"emergency_revoke_client_table_access","sql_md5":null},{"version":"20261018","name":"supabase_auth_identity","sql_md5":null},{"version":"20261019","name":"member_read_rls","sql_md5":null},{"version":"20261020","name":"prague_areas","sql_md5":null},{"version":"20261021","name":"desire_graph","sql_md5":null},{"version":"20261022","name":"member_boundaries","sql_md5":null},{"version":"20261022044018","name":"durable_unread_message_emails","sql_md5":"6961890acc3b3a1eaa1716f81cd63002"},{"version":"20261023","name":"tonight_plans","sql_md5":null},{"version":"20261024","name":"interest_visitors","sql_md5":null},{"version":"20261024201630","name":"durable_interest_access_alerts","sql_md5":"771edca4f99bf30ee38fd2929415a06c"},{"version":"20261024205326","name":"scene_company_plans","sql_md5":"3e31516aacb0309c4723fb61b1bc7956"},{"version":"20261025","name":"private_access","sql_md5":null},{"version":"20261026","name":"return_emails","sql_md5":null},{"version":"20261027","name":"scene_events","sql_md5":null},{"version":"20261028","name":"rate_limits","sql_md5":null},{"version":"20261101","name":"media_variants","sql_md5":"a144e6af10b5eb975b5e2d63ce1caec5"},{"version":"20261102","name":"plan_start_times","sql_md5":"6c4a4e7371ce63e7d6a47ef3678243b3"},{"version":"20261103","name":"introductions","sql_md5":"2a1f983d5bc1339b06806f58387bf4b2"},{"version":"20261104","name":"block_aware_message_reads","sql_md5":"1cd73751c6f9ce761e65999956296e0b"}]'::jsonb;
 actual jsonb; before_metadata jsonb; after_metadata jsonb; changed integer;
begin
 select jsonb_agg(jsonb_build_object('version',version,'name',name,'sql_md5',md5(array_to_string(statements,E'\n'))) order by version) into actual
 from supabase_migrations.schema_migrations;
 if actual is distinct from expected then raise exception 'Ledger differs from reviewed preflight; stop'; end if;
 if exists(select 1 from pg_trigger where tgrelid='supabase_migrations.schema_migrations'::regclass and not tgisinternal) then raise exception 'Unexpected ledger trigger'; end if;
 if exists(select 1 from supabase_migrations.schema_migrations old join supabase_migrations.schema_migrations dest on dest.version=old.version||'000000' where length(old.version)=8) then raise exception 'Destination collision'; end if;
 select jsonb_agg(to_jsonb(m)-'version' order by name,version) into before_metadata from supabase_migrations.schema_migrations m;
 update supabase_migrations.schema_migrations set version=version||'000000' where version ~ '^[0-9]{8}$';
 get diagnostics changed = row_count;
 if changed<>35 then raise exception 'Unexpected repair count: %',changed; end if;
 select jsonb_agg(to_jsonb(m)-'version' order by name,version) into after_metadata from supabase_migrations.schema_migrations m;
 if before_metadata is distinct from after_metadata then raise exception 'Non-version ledger metadata changed'; end if;
 if exists(select 1 from supabase_migrations.schema_migrations where version !~ '^[0-9]{14}$') then raise exception 'Noncanonical version remains'; end if;
end $repair$;
commit;
