-- Read-only post-migration staging verification.
select
  to_regclass('public.profiles') is not null as profiles_exists,
  to_regclass('public.moderation_cases') is not null as moderation_exists,
  to_regclass('public.privacy_requests') is not null as privacy_exists,
  to_regclass('public.media_objects') is not null as private_media_exists,
  to_regclass('public.admin_action_events') is not null as admin_audit_exists,
  to_regclass('public.admin_assignments') is not null as admin_assignments_exists,
  to_regclass('public.elevated_admin_sessions') is not null as god_sessions_exists,
  to_regclass('public.sensitive_access_events') is not null as sensitive_audit_exists,
  not has_table_privilege('anon', 'public.profiles', 'select') as anon_profiles_denied,
  not has_table_privilege('authenticated', 'public.profiles', 'select') as authenticated_profiles_denied,
  exists (
    select 1 from public.system_feature_flags
    where flag_key = 'MONETIZATION_ENABLED' and enabled = false
  ) as monetization_disabled;
