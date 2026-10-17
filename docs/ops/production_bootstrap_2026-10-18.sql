-- ONE-TIME production bootstrap for Supabase project bkdyjdbmtucqvgebqadp (issue #8).
-- Paste the whole file into Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Generated from supabase/migrations/* (the source of truth). Aborts if any legacy row exists.
-- Delete this file after it has been applied.

-- ===== 20260805_drop_legacy_bootstrap.sql
-- Removes the pre-canonical bootstrap schema (production migration 001_initial_schema,
-- applied 2026-09-22) so the canonical migrations that follow can create the real tables.
-- Acts only when the legacy shape is present (profiles without account_status), and
-- refuses to drop anything if a legacy table holds data. No-op on fresh or canonical databases.
do $$
declare t text; n bigint;
  legacy constant text[] := array['profiles','dating_ads','photo_albums','videos','chat_messages','connections','notifications','direct_messages'];
begin
  if to_regclass('public.profiles') is null
     or exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'account_status') then
    return;
  end if;
  foreach t in array legacy loop
    if to_regclass('public.' || t) is not null then
      execute format('select count(*) from public.%I', t) into n;
      if n > 0 then
        raise exception 'Legacy table public.% has % rows; migrate the data before dropping', t, n;
      end if;
    end if;
  end loop;
  drop table if exists public.direct_messages, public.notifications, public.connections, public.chat_messages,
    public.videos, public.photo_albums, public.dating_ads, public.profiles cascade;
end $$;

-- ===== 20260806_canonical_base_schema.sql
-- Canonical Intimo free-MVP base schema for new environments.
-- Auth0 is the identity provider: no local password table is created.
-- Browser roles receive no grants or permissive policies.
begin;
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(), auth_id text unique not null, email text unique not null,
  display_name text not null default 'Member', username text, role text not null default 'MEMBER',
  member_tier text not null default 'FREE', verification_status text not null default 'UNVERIFIED', verification_level text,
  avatar_url text, cover_photo_url text, date_of_birth text, age integer check (age is null or age >= 18),
  gender text, sexual_orientation text, country text default '', city text default '', location text default '',
  languages jsonb not null default '["English"]'::jsonb, headline text, bio text,
  interests jsonb not null default '[]'::jsonb, lifestyle_tags jsonb not null default '[]'::jsonb,
  hobbies jsonb not null default '[]'::jsonb, relationship_status text, looking_for jsonb not null default '[]'::jsonb,
  is_couple_profile boolean not null default false, partner_display_name text, partner_age integer check (partner_age is null or partner_age >= 18), partner_gender text,
  pubic_hair_grooming text, piercing text, tattoo text, erogenous_zones jsonb not null default '[]'::jsonb,
  favourite_sex_places jsonb not null default '[]'::jsonb, favourite_sex_positions jsonb not null default '[]'::jsonb,
  sex_hobbies jsonb not null default '[]'::jsonb, categories jsonb not null default '[]'::jsonb,
  monthly_subscription_price numeric, followers_count integer not null default 0, subscribers_count integer not null default 0,
  total_content_count integer not null default 0, public_profile_visibility boolean not null default false,
  photo_visibility_default text not null default 'PRIVATE', location_precision text not null default 'CITY',
  show_online_status boolean not null default false, show_distance boolean not null default false,
  allow_direct_messages boolean not null default false, require_verification_to_message boolean not null default true,
  gallery_images jsonb not null default '[]'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_profiles_auth_id on public.profiles(auth_id);
create index if not exists idx_profiles_email on public.profiles(email);

create table if not exists public.dating_ads (
  id uuid primary key default gen_random_uuid(), author_id uuid not null references public.profiles(id) on delete cascade,
  author_name text not null, author_avatar text, is_verified boolean not null default false, category text not null,
  title text not null, text text not null, photo_url text, validity_days integer not null default 7,
  country text, region text, allowed_reply_genders jsonb not null default '[]'::jsonb, transgender_option text,
  min_age integer not null default 18 check (min_age >= 18), max_age integer not null default 100,
  require_vip boolean not null default false, require_media boolean not null default false,
  require_verified boolean not null default false, status text not null default 'active', created_at timestamptz not null default now()
);
create index if not exists idx_dating_ads_author on public.dating_ads(author_id);

create table if not exists public.photo_albums (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, description text, cover_url text, photos jsonb not null default '[]'::jsonb,
  photo_count integer not null default 0, monetization text not null default 'FREE', credits_price integer,
  category text, topics jsonb not null default '[]'::jsonb, views integer not null default 0,
  comments integer not null default 0, likes integer not null default 0, status text not null default 'On web', created_at timestamptz not null default now()
);
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, description text, video_url text, thumbnail_url text, duration text,
  monetization text not null default 'FREE', credits_price integer, category text, comment_permission text not null default 'ANYONE',
  voting_permission text not null default 'ANYONE', topics jsonb not null default '[]'::jsonb,
  views integer not null default 0, comments integer not null default 0, likes integer not null default 0,
  status text not null default 'On web', created_at timestamptz not null default now()
);
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(), room_id text not null, sender_id uuid references public.profiles(id) on delete set null,
  sender_name text not null, sender_avatar text, sender_gender text, content text not null, created_at timestamptz not null default now()
);
create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(), follower_id uuid not null references public.profiles(id) on delete cascade,
  followed_id uuid not null references public.profiles(id) on delete cascade, connection_type text not null default 'follow',
  created_at timestamptz not null default now(), unique(follower_id,followed_id,connection_type), check(follower_id <> followed_id)
);
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null, title text not null, message text not null, actor_name text, actor_avatar text,
  target_link text, is_read boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(), conversation_id text not null,
  sender_id uuid references public.profiles(id) on delete set null, receiver_id uuid references public.profiles(id) on delete set null,
  sender_name text not null, sender_avatar text, content text not null, media_url text, attachment_type text,
  is_disappearing boolean not null default false, disappear_timer_sec integer, is_opened boolean not null default false,
  status text not null default 'SENT', is_locked boolean not null default false, unlock_price numeric,
  is_unlocked boolean not null default false, created_at timestamptz not null default now()
);

create index if not exists idx_dm_conversation on public.direct_messages(conversation_id,created_at desc);
create index if not exists idx_connections_follower on public.connections(follower_id);
create index if not exists idx_connections_followed on public.connections(followed_id);
create index if not exists idx_notifications_user on public.notifications(user_id,created_at desc);

alter table public.profiles enable row level security; alter table public.dating_ads enable row level security;
alter table public.photo_albums enable row level security; alter table public.videos enable row level security;
alter table public.chat_messages enable row level security; alter table public.connections enable row level security;
alter table public.notifications enable row level security; alter table public.direct_messages enable row level security;
revoke all on table public.profiles, public.dating_ads, public.photo_albums, public.videos, public.chat_messages, public.connections, public.notifications, public.direct_messages from anon, authenticated;
commit;

-- ===== 20260807_lock_down_auth0_boundary.sql
-- Intimo Auth0 server-boundary lockdown
-- Date: 2026-08-07
--
-- DO NOT APPLY until every affected browser Supabase call has been moved behind
-- an Auth0-authenticated Next.js API using SUPABASE_SERVICE_ROLE_KEY.
-- Auth0 subjects are not Supabase auth.uid() values, so native user RLS policies
-- would not establish the intended ownership boundary in the current architecture.

begin;

-- Remove the legacy MVP policies that expose all rows to the public anon key.
drop policy if exists "Allow all select on profiles" on public.profiles;
drop policy if exists "Allow all insert on profiles" on public.profiles;
drop policy if exists "Allow all update on profiles" on public.profiles;

drop policy if exists "Allow all select on dating_ads" on public.dating_ads;
drop policy if exists "Allow all insert on dating_ads" on public.dating_ads;
drop policy if exists "Allow all update on dating_ads" on public.dating_ads;
drop policy if exists "Allow all delete on dating_ads" on public.dating_ads;

drop policy if exists "Allow all select on photo_albums" on public.photo_albums;
drop policy if exists "Allow all insert on photo_albums" on public.photo_albums;
drop policy if exists "Allow all update on photo_albums" on public.photo_albums;
drop policy if exists "Allow all delete on photo_albums" on public.photo_albums;

drop policy if exists "Allow all select on videos" on public.videos;
drop policy if exists "Allow all insert on videos" on public.videos;
drop policy if exists "Allow all update on videos" on public.videos;
drop policy if exists "Allow all delete on videos" on public.videos;

drop policy if exists "Allow all select on chat_messages" on public.chat_messages;
drop policy if exists "Allow all insert on chat_messages" on public.chat_messages;

drop policy if exists "Allow all select on connections" on public.connections;
drop policy if exists "Allow all insert on connections" on public.connections;
drop policy if exists "Allow all delete on connections" on public.connections;

drop policy if exists "Allow all select on notifications" on public.notifications;
drop policy if exists "Allow all insert on notifications" on public.notifications;
drop policy if exists "Allow all update on notifications" on public.notifications;

drop policy if exists "Allow all select on direct_messages" on public.direct_messages;
drop policy if exists "Allow all insert on direct_messages" on public.direct_messages;

-- Defense in depth: neither the public anon role nor a Supabase-authenticated
-- browser role may access these tables directly. The service_role bypasses RLS
-- and remains restricted to server-only environment variables.
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.dating_ads from anon, authenticated;
revoke all on table public.photo_albums from anon, authenticated;
revoke all on table public.videos from anon, authenticated;
revoke all on table public.chat_messages from anon, authenticated;
revoke all on table public.connections from anon, authenticated;
revoke all on table public.notifications from anon, authenticated;
revoke all on table public.direct_messages from anon, authenticated;

alter table public.profiles force row level security;
alter table public.dating_ads force row level security;
alter table public.photo_albums force row level security;
alter table public.videos force row level security;
alter table public.chat_messages force row level security;
alter table public.connections force row level security;
alter table public.notifications force row level security;
alter table public.direct_messages force row level security;

commit;

-- Rollback procedure (emergency only): restore grants only after installing
-- explicit owner/participant policies. Never recreate USING(true) or
-- WITH CHECK(true) policies. A rollback that restores public access is unsafe.

-- ===== 20260808_free_mvp_privacy_foundation.sql
-- Intimo free MVP: privacy, age-assurance and consent foundation.
-- FORWARD: apply only after 20260807_lock_down_auth0_boundary.sql and after
-- SUPABASE_SERVICE_ROLE_KEY is configured exclusively on the Next.js server.
-- ROLLBACK: drop the four new tables, then drop the added profile columns.
-- Existing data is not backfilled as legally valid consent or age verification.

alter table public.profiles
  add column if not exists age_verification_status text not null default 'UNVERIFIED',
  add column if not exists age_verified_at timestamptz,
  add column if not exists age_verification_method text,
  add column if not exists sensitive_fields_visibility text not null default 'PRIVATE',
  add column if not exists profile_visibility text not null default 'MEMBERS_ONLY',
  add column if not exists message_permission text not null default 'MEMBERS_ONLY';

alter table public.profiles
  drop constraint if exists profiles_age_verification_status_check,
  add constraint profiles_age_verification_status_check check
    (age_verification_status in ('UNVERIFIED','AGE_DECLARED','AGE_VERIFIED','FAILED','REVIEW_REQUIRED')),
  drop constraint if exists profiles_sensitive_fields_visibility_check,
  add constraint profiles_sensitive_fields_visibility_check check
    (sensitive_fields_visibility in ('EVERYONE','MEMBERS_ONLY','MATCHING_USERS','APPROVED_USERS','PRIVATE')),
  drop constraint if exists profiles_profile_visibility_check,
  add constraint profiles_profile_visibility_check check
    (profile_visibility in ('EVERYONE','MEMBERS_ONLY','MATCHING_USERS','APPROVED_USERS','PRIVATE'));

create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  consent_type text not null,
  consent_version text not null,
  consent_timestamp timestamptz not null default now(),
  consent_status text not null check (consent_status in ('GRANTED','WITHDRAWN')),
  withdrawn_at timestamptz,
  source text not null default 'PRIVACY_CENTER',
  created_at timestamptz not null default now()
);
create index if not exists idx_user_consents_profile_type
  on public.user_consents(profile_id, consent_type, consent_timestamp desc);

create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  request_type text not null check (request_type in ('ACCESS','EXPORT','CORRECTION','DELETION','RESTRICTION','OBJECTION')),
  status text not null default 'OPEN' check (status in ('OPEN','IN_PROGRESS','COMPLETED','REJECTED')),
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  notes text
);

create table if not exists public.retention_rules (
  data_category text primary key,
  retention_days integer,
  disposition text not null check (disposition in ('DELETE','ANONYMIZE','LEGAL_HOLD_REVIEW')),
  purpose text not null,
  updated_at timestamptz not null default now()
);
insert into public.retention_rules(data_category, retention_days, disposition, purpose) values
  ('DELETED_ACCOUNTS', 30, 'ANONYMIZE', 'Complete erasure workflow and fraud/safety reconciliation'),
  ('MESSAGES', 365, 'DELETE', 'User communications; subject to participant deletion and legal holds'),
  ('MEDIA', 30, 'DELETE', 'Remove orphaned/deleted-account media'),
  ('REPORTS', 1095, 'LEGAL_HOLD_REVIEW', 'Safety, notice-and-action and legal defense'),
  ('MODERATION_EVIDENCE', 1095, 'LEGAL_HOLD_REVIEW', 'Safety decisions and appeals'),
  ('AUTHENTICATION_LOGS', 180, 'DELETE', 'Security and abuse prevention'),
  ('AUDIT_LOGS', 730, 'LEGAL_HOLD_REVIEW', 'Security and privileged-action accountability'),
  ('VERIFICATION_RECORDS', 365, 'DELETE', 'Age/identity verification lifecycle')
on conflict (data_category) do update set
  retention_days = excluded.retention_days,
  disposition = excluded.disposition,
  purpose = excluded.purpose,
  updated_at = now();

alter table public.user_consents enable row level security;
alter table public.user_consents force row level security;
alter table public.privacy_requests enable row level security;
alter table public.privacy_requests force row level security;
alter table public.retention_rules enable row level security;
alter table public.retention_rules force row level security;
revoke all on table public.user_consents, public.privacy_requests, public.retention_rules from anon, authenticated;

-- ===== 20260809_safety_moderation_foundation.sql
-- Intimo free MVP safety boundary. Apply only after the server-only Auth0 data
-- boundary is configured. Rollback: drop tables in reverse dependency order.

create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(blocker_id, blocked_profile_id),
  check (blocker_id <> blocked_profile_id)
);
create index if not exists idx_user_blocks_blocked on public.user_blocks(blocked_profile_id);

create table if not exists public.moderation_cases (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete restrict,
  reported_user_id uuid references public.profiles(id) on delete set null,
  content_type text not null check (content_type in ('PROFILE','PHOTO','VIDEO','MESSAGE','POST','COMMENT','COMMUNITY','EVENT','LIVESTREAM')),
  content_id text,
  reason text not null check (reason in ('SUSPECTED_MINOR','NON_CONSENSUAL_INTIMATE_CONTENT','HARASSMENT','THREATS','IMPERSONATION','SCAM_FRAUD','ILLEGAL_CONTENT','EXPLOITATION_TRAFFICKING','COPYRIGHT_INFRINGEMENT','PRIVACY_VIOLATION','PROHIBITED_COMMERCIAL_SEXUAL_SERVICES','SPAM','OTHER')),
  description text not null,
  status text not null default 'OPEN' check (status in ('OPEN','UNDER_REVIEW','ACTION_REQUIRED','RESOLVED','REJECTED','APPEALED','ESCALATED')),
  priority text not null default 'STANDARD' check (priority in ('STANDARD','HIGH','CRITICAL')),
  assigned_moderator uuid references public.profiles(id) on delete set null,
  decision text,
  decision_reason text,
  decision_timestamp timestamptz,
  appeal_status text not null default 'NONE' check (appeal_status in ('NONE','OPEN','UNDER_REVIEW','UPHELD','OVERTURNED','PARTIALLY_OVERTURNED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_moderation_cases_status_priority on public.moderation_cases(status, priority, created_at);

create table if not exists public.moderation_appeals (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.moderation_cases(id) on delete cascade,
  appellant_id uuid not null references public.profiles(id) on delete restrict,
  reason text not null,
  status text not null default 'OPEN' check (status in ('OPEN','UNDER_REVIEW','UPHELD','OVERTURNED','PARTIALLY_OVERTURNED')),
  assigned_reviewer uuid references public.profiles(id) on delete set null,
  decision_reason text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table if not exists public.copyright_notices (
  id uuid primary key default gen_random_uuid(),
  claimant_profile_id uuid references public.profiles(id) on delete set null,
  claimant_name text not null,
  claimant_email text not null,
  content_type text not null,
  content_id text not null,
  complaint text not null,
  good_faith_confirmed boolean not null,
  accuracy_confirmed boolean not null,
  status text not null default 'OPEN' check (status in ('OPEN','UNDER_REVIEW','ACTIONED','REJECTED','COUNTER_NOTICE','RESOLVED')),
  action text,
  counter_notice text,
  resolution text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_blocks enable row level security;
alter table public.user_blocks force row level security;
alter table public.moderation_cases enable row level security;
alter table public.moderation_cases force row level security;
alter table public.moderation_appeals enable row level security;
alter table public.moderation_appeals force row level security;
alter table public.copyright_notices enable row level security;
alter table public.copyright_notices force row level security;
revoke all on table public.user_blocks, public.moderation_cases, public.moderation_appeals, public.copyright_notices from anon, authenticated;

-- ===== 20260810_critical_compliance_controls.sql
-- Critical free-MVP controls: durable audit history, age references, deletion
-- lifecycle, private media metadata and participant declarations.
-- Apply after 20260809 in a reviewed staging clone. Rollback is table-by-table;
-- never restore permissive RLS policies.

alter table public.profiles
  add column if not exists age_verification_provider_reference text,
  add column if not exists account_lifecycle_status text not null default 'ACTIVE',
  add column if not exists deletion_requested_at timestamptz,
  add column if not exists deactivated_at timestamptz,
  add column if not exists anonymization_started_at timestamptz,
  add column if not exists deleted_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_account_lifecycle_status_check,
  add constraint profiles_account_lifecycle_status_check check
    (account_lifecycle_status in ('ACTIVE','DELETION_REQUESTED','DEACTIVATED','RETENTION_HOLD_IF_REQUIRED','ANONYMIZATION_IN_PROGRESS','DELETED'));

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  actor_auth0_sub text,
  action text not null,
  resource_type text,
  resource_id text,
  outcome text not null check (outcome in ('SUCCESS','DENIED','ERROR')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_events_actor_created on public.audit_events(actor_profile_id, created_at desc);
create index if not exists idx_audit_events_resource on public.audit_events(resource_type, resource_id, created_at desc);

create table if not exists public.moderation_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.moderation_cases(id) on delete cascade,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  from_status text,
  to_status text,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists idx_moderation_events_case on public.moderation_events(case_id, created_at);

create table if not exists public.media_objects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  object_key text unique not null,
  media_type text not null check (media_type in ('IMAGE','VIDEO','DOCUMENT')),
  mime_type text not null,
  byte_size bigint not null check (byte_size > 0),
  visibility text not null default 'PRIVATE' check (visibility in ('PUBLIC','MEMBERS_ONLY','FOLLOWERS_ONLY','PRIVATE','APPROVED_USERS_ONLY')),
  upload_status text not null default 'PENDING' check (upload_status in ('PENDING','AVAILABLE','QUARANTINED','REMOVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_media_objects_owner on public.media_objects(owner_id, created_at desc);

create table if not exists public.content_participant_declarations (
  id uuid primary key default gen_random_uuid(),
  media_id uuid not null references public.media_objects(id) on delete cascade,
  uploader_id uuid not null references public.profiles(id) on delete restrict,
  contains_other_identifiable_participants boolean not null,
  all_participants_adults boolean not null,
  recording_consented boolean not null,
  publication_consented boolean not null,
  declaration_version text not null,
  declared_at timestamptz not null default now()
);

alter table public.audit_events enable row level security;
alter table public.audit_events force row level security;
alter table public.moderation_events enable row level security;
alter table public.moderation_events force row level security;
alter table public.media_objects enable row level security;
alter table public.media_objects force row level security;
alter table public.content_participant_declarations enable row level security;
alter table public.content_participant_declarations force row level security;
revoke all on table public.audit_events, public.moderation_events, public.media_objects, public.content_participant_declarations from anon, authenticated;

-- ===== 20260811_admin_command_center.sql
-- Intimo free-MVP least-privilege admin command center.
-- Apply after 20260810 in a staging clone. This migration does not grant browser
-- roles any access and does not enable monetization. Roll back by dropping the
-- new tables and profile columns only after exporting required audit evidence.

alter table public.profiles
  add column if not exists account_status text not null default 'ACTIVE',
  add column if not exists discovery_disabled boolean not null default false,
  add column if not exists messaging_disabled boolean not null default false,
  add column if not exists media_uploads_disabled boolean not null default false,
  add column if not exists restriction_reason text,
  add column if not exists restriction_expires_at timestamptz,
  add column if not exists last_active_at timestamptz;

alter table public.profiles drop constraint if exists profiles_account_status_check;
alter table public.profiles add constraint profiles_account_status_check check
  (account_status in ('ACTIVE','RESTRICTED','SUSPENDED','BANNED','DELETION_REQUESTED','DEACTIVATED'));

create table if not exists public.admin_action_events (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid not null references public.profiles(id) on delete restrict,
  actor_role text not null,
  action text not null,
  category text not null,
  resource_type text not null,
  resource_id text not null,
  reason text not null,
  notes text,
  previous_state jsonb not null default '{}'::jsonb,
  new_state jsonb not null default '{}'::jsonb,
  security_metadata jsonb not null default '{}'::jsonb,
  confirmation_token_hash text,
  created_at timestamptz not null default now()
);
create index if not exists idx_admin_action_resource on public.admin_action_events(resource_type, resource_id, created_at desc);
create index if not exists idx_admin_action_actor on public.admin_action_events(actor_profile_id, created_at desc);

create table if not exists public.verification_reviews (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete restrict,
  verification_type text not null check (verification_type in ('EMAIL','PHONE','AGE','IDENTITY','CREATOR')),
  status text not null default 'PENDING' check (status in ('PENDING','VERIFIED','FAILED','REVIEW_REQUIRED','RETRY_REQUESTED')),
  provider_method text,
  provider_reference text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reason text
);
create index if not exists idx_verification_reviews_queue on public.verification_reviews(status, verification_type, submitted_at);

alter table public.privacy_requests
  add column if not exists due_at timestamptz,
  add column if not exists assigned_admin_id uuid references public.profiles(id) on delete set null,
  add column if not exists request_category text,
  add column if not exists updated_at timestamptz not null default now();
alter table public.privacy_requests drop constraint if exists privacy_requests_status_check;
alter table public.privacy_requests add constraint privacy_requests_status_check check
  (status in ('OPEN','IDENTITY_CONFIRMATION_REQUIRED','IN_PROGRESS','COMPLETED','REJECTED_WITH_REASON','LEGAL_REVIEW'));

alter table public.media_objects
  add column if not exists moderation_status text not null default 'ACTIVE',
  add column if not exists moderator_note text,
  add column if not exists sensitive_preview_accessed_at timestamptz;
alter table public.media_objects drop constraint if exists media_objects_moderation_status_check;
alter table public.media_objects add constraint media_objects_moderation_status_check check
  (moderation_status in ('ACTIVE','UNDER_REVIEW','HIDDEN','REMOVED','RESTORED'));

create table if not exists public.system_feature_flags (
  flag_key text primary key,
  enabled boolean not null,
  description text not null,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.system_feature_flags(flag_key, enabled, description) values
  ('MONETIZATION_ENABLED', false, 'Permanent free-MVP safety invariant'),
  ('CREATOR_MODE_ENABLED', true, 'Free creator discovery only'),
  ('LIVESTREAM_ENABLED', false, 'Disabled pending safety and legal gates'),
  ('COMMUNITIES_ENABLED', true, 'Free community experience'),
  ('EVENTS_ENABLED', false, 'Disabled pending durable operations'),
  ('AGE_VERIFICATION_REQUIRED', true, 'Adult access server gate')
on conflict (flag_key) do nothing;

alter table public.admin_action_events enable row level security;
alter table public.admin_action_events force row level security;
alter table public.verification_reviews enable row level security;
alter table public.verification_reviews force row level security;
alter table public.system_feature_flags enable row level security;
alter table public.system_feature_flags force row level security;
revoke all on table public.admin_action_events, public.verification_reviews, public.system_feature_flags from anon, authenticated;

-- Audit rows are append-only even for the server role unless deliberately
-- accessed by a migration owner. The application has no update/delete endpoint.

-- ===== 20260812_super_admin_elevation.sql
-- Intimo SUPER_ADMIN / God Mode. Apply after 20260811 in staging first.
-- Browser roles receive no access. Never place secret values in these tables.

create table if not exists public.admin_assignments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete restrict,
  role text not null check (role in ('SUPER_ADMIN','SYSTEM_ADMIN','TRUST_AND_SAFETY_ADMIN','CONTENT_MODERATOR','PRIVACY_ADMIN','SUPPORT_ADMIN','COMMUNITY_ADMIN')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','SUSPENDED','REVOKED')),
  granted_by uuid references public.profiles(id) on delete set null,
  grant_reason text not null,
  granted_at timestamptz not null default now(),
  revoked_by uuid references public.profiles(id) on delete set null,
  revoked_at timestamptz,
  revoke_reason text
);
create index if not exists idx_admin_assignments_role_status on public.admin_assignments(role,status);

create table if not exists public.elevated_admin_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete restrict,
  token_hash text not null unique,
  reason text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  revoked_reason text,
  last_used_at timestamptz not null default now()
);
create index if not exists idx_elevated_sessions_profile_expiry on public.elevated_admin_sessions(profile_id,expires_at desc);

create table if not exists public.sensitive_access_events (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid not null references public.profiles(id) on delete restrict,
  elevated_session_id uuid not null references public.elevated_admin_sessions(id) on delete restrict,
  access_type text not null check (access_type in ('PRIVATE_MEDIA','MESSAGE_EVIDENCE','PRECISE_LOCATION','VERIFICATION_EVIDENCE','VIEW_AS_USER')),
  resource_type text not null,
  resource_id text not null,
  case_reference text not null,
  reason text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_sensitive_access_resource on public.sensitive_access_events(resource_type,resource_id,created_at desc);

insert into public.system_feature_flags(flag_key,enabled,description) values
  ('REGISTRATION_ENABLED', true, 'Allow new Auth0 registrations'),
  ('MAINTENANCE_MODE', false, 'Restrict product access during incidents'),
  ('MEDIA_UPLOADS_ENABLED', true, 'Global emergency upload switch'),
  ('MESSAGING_ENABLED', true, 'Global emergency messaging switch')
on conflict (flag_key) do nothing;

alter table public.admin_assignments enable row level security;
alter table public.admin_assignments force row level security;
alter table public.elevated_admin_sessions enable row level security;
alter table public.elevated_admin_sessions force row level security;
alter table public.sensitive_access_events enable row level security;
alter table public.sensitive_access_events force row level security;
revoke all on table public.admin_assignments, public.elevated_admin_sessions, public.sensitive_access_events from anon, authenticated;

-- The application exposes no update/delete endpoint for historical audit or
-- sensitive-access records. Rollback requires an infrastructure-level review.

-- ===== 20260813_internal_admin_mfa.sql
-- Intimo-owned TOTP MFA for privileged administration without a paid IdP MFA add-on.
-- Apply after 20260812. Secrets are encrypted by the application before insertion.

create table if not exists public.admin_mfa_credentials (
  profile_id uuid primary key references public.profiles(id) on delete restrict,
  encrypted_secret text not null,
  status text not null default 'PENDING' check (status in ('PENDING','ACTIVE','REVOKED')),
  failed_attempts integer not null default 0 check (failed_attempts >= 0),
  locked_until timestamptz,
  enrolled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_mfa_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete restrict,
  token_hash text not null unique,
  verified_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_used_at timestamptz not null default now()
);
create index if not exists idx_admin_mfa_sessions_profile_expiry on public.admin_mfa_sessions(profile_id, expires_at desc);

alter table public.admin_mfa_credentials enable row level security;
alter table public.admin_mfa_credentials force row level security;
alter table public.admin_mfa_sessions enable row level security;
alter table public.admin_mfa_sessions force row level security;
revoke all on table public.admin_mfa_credentials, public.admin_mfa_sessions from anon, authenticated;

-- Rollback (only before enrollment): drop admin_mfa_sessions, then admin_mfa_credentials.

-- ===== 20260814_public_community_content.sql
-- Durable content and interaction foundation for the free public-community MVP.
-- Apply after 20260813 in staging first. This is additive and does not grant
-- browser roles direct database access. Rollback notes are at the end.
begin;

alter table public.media_objects
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists category text,
  add column if not exists tags jsonb not null default '[]'::jsonb,
  add column if not exists thumbnail_media_id uuid references public.media_objects(id) on delete set null,
  add column if not exists processing_status text not null default 'READY',
  add column if not exists published_at timestamptz;

alter table public.media_objects drop constraint if exists media_objects_processing_status_check;
alter table public.media_objects add constraint media_objects_processing_status_check check
  (processing_status in ('UPLOADING','PROCESSING','READY','FAILED','REJECTED'));

alter table public.media_objects drop constraint if exists media_objects_moderation_status_check;
-- Legacy ACTIVE rows were not approved through a durable moderation workflow.
-- Fail closed rather than treating them as public approvals.
update public.media_objects
set moderation_status = 'PENDING_REVIEW'
where moderation_status in ('ACTIVE','RESTORED');
alter table public.media_objects alter column moderation_status set default 'PENDING_REVIEW';
alter table public.media_objects add constraint media_objects_moderation_status_check check
  (moderation_status in ('PENDING_REVIEW','UNDER_REVIEW','APPROVED','REJECTED','HIDDEN','REMOVED'));

create index if not exists idx_media_public_feed
  on public.media_objects(media_type, visibility, moderation_status, processing_status, published_at desc, id);

create table if not exists public.content_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  post_type text not null check (post_type in ('TEXT_POST','FORUM_POST','STORY')),
  title text,
  body text not null,
  category text,
  tags jsonb not null default '[]'::jsonb,
  visibility text not null default 'MEMBERS_ONLY' check (visibility in ('PUBLIC','MEMBERS_ONLY','FOLLOWERS_ONLY','PRIVATE')),
  moderation_status text not null default 'PENDING_REVIEW' check (moderation_status in ('PENDING_REVIEW','UNDER_REVIEW','APPROVED','REJECTED','HIDDEN','REMOVED')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_content_posts_feed on public.content_posts(visibility, moderation_status, published_at desc, id);
create index if not exists idx_content_posts_author on public.content_posts(author_id, created_at desc);

create table if not exists public.content_comments (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('MEDIA','POST','DATING_AD')),
  target_id uuid not null,
  body text not null check (char_length(body) between 1 and 2000),
  moderation_status text not null default 'VISIBLE' check (moderation_status in ('VISIBLE','UNDER_REVIEW','HIDDEN','REMOVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_content_comments_target on public.content_comments(target_type, target_id, created_at, id);
create index if not exists idx_content_comments_author on public.content_comments(author_id, created_at desc);

create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('PROFILE','MEDIA','POST','DATING_AD')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  unique(profile_id, target_type, target_id)
);
create index if not exists idx_saved_items_profile on public.saved_items(profile_id, created_at desc);

create table if not exists public.content_reactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('MEDIA','POST','DATING_AD','COMMENT')),
  target_id uuid not null,
  reaction text not null default 'LIKE' check (reaction in ('LIKE')),
  created_at timestamptz not null default now(),
  unique(profile_id, target_type, target_id, reaction)
);
create index if not exists idx_content_reactions_target on public.content_reactions(target_type, target_id, created_at desc);

alter table public.content_posts enable row level security;
alter table public.content_posts force row level security;
alter table public.content_comments enable row level security;
alter table public.content_comments force row level security;
alter table public.saved_items enable row level security;
alter table public.saved_items force row level security;
alter table public.content_reactions enable row level security;
alter table public.content_reactions force row level security;
revoke all on table public.content_posts, public.content_comments, public.saved_items, public.content_reactions from anon, authenticated;

commit;

-- Rollback: drop content_reactions, saved_items, content_comments and
-- content_posts in that order. Media columns may be dropped only after proving
-- no application or audit record depends on them. Never restore ACTIVE as a
-- synonym for public moderation approval.

-- ===== 20260815_retention_execution.sql
-- Scheduled privacy retention and deletion execution.
-- Apply after 20260814 in staging. The worker is inert unless the server-only
-- INTIMO_RETENTION_CRON_SECRET is configured and an authenticated scheduler calls it.
begin;
create table if not exists public.retention_holds (
  id uuid primary key default gen_random_uuid(), profile_id uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','RELEASED')), reason text not null,
  authority_reference text not null, created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), released_by uuid references public.profiles(id) on delete set null,
  released_at timestamptz, release_reason text
);
create index if not exists idx_retention_holds_profile_status on public.retention_holds(profile_id,status);
create table if not exists public.retention_runs (
  id uuid primary key default gen_random_uuid(), trigger_type text not null check (trigger_type in ('SCHEDULED','MANUAL')),
  status text not null check (status in ('RUNNING','COMPLETED','COMPLETED_WITH_ERRORS','FAILED')),
  started_at timestamptz not null default now(), completed_at timestamptz, processed_count integer not null default 0,
  completed_count integer not null default 0, failed_count integer not null default 0, skipped_count integer not null default 0,
  error_summary text
);
create table if not exists public.retention_execution_events (
  id uuid primary key default gen_random_uuid(), run_id uuid not null references public.retention_runs(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  outcome text not null check (outcome in ('COMPLETED','SKIPPED','FAILED')), detail text, created_at timestamptz not null default now()
);
create index if not exists idx_retention_execution_profile on public.retention_execution_events(profile_id,created_at desc);
alter table public.retention_holds enable row level security; alter table public.retention_holds force row level security;
alter table public.retention_runs enable row level security; alter table public.retention_runs force row level security;
alter table public.retention_execution_events enable row level security; alter table public.retention_execution_events force row level security;
revoke all on table public.retention_holds, public.retention_runs, public.retention_execution_events from anon, authenticated;
commit;
-- Rollback: disable the scheduler and preserve required deletion evidence, then
-- drop retention_execution_events, retention_runs and retention_holds.

-- ===== 20260816_transactional_safety_actions.sql
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

-- ===== 20260817_canonical_media_albums.sql
-- Canonical albums group media_objects without duplicating storage URLs.
-- Apply after 20260816 in a backed-up staging project first.
begin;

create table if not exists public.media_albums (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text check (description is null or char_length(description) <= 4000),
  category text check (category is null or char_length(category) <= 100),
  tags jsonb not null default '[]'::jsonb,
  visibility text not null default 'PRIVATE' check (visibility in ('PUBLIC','MEMBERS_ONLY','FOLLOWERS_ONLY','PRIVATE')),
  moderation_status text not null default 'PENDING_REVIEW' check (moderation_status in ('PENDING_REVIEW','UNDER_REVIEW','APPROVED','REJECTED','HIDDEN','REMOVED')),
  moderator_note text,
  cover_media_id uuid references public.media_objects(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_album_items (
  album_id uuid not null references public.media_albums(id) on delete cascade,
  media_id uuid not null references public.media_objects(id) on delete cascade,
  sort_order integer not null check (sort_order >= 0),
  added_at timestamptz not null default now(),
  primary key (album_id, media_id),
  unique (album_id, sort_order)
);

create index if not exists idx_media_albums_public on public.media_albums(visibility,moderation_status,published_at desc,id);
create index if not exists idx_media_albums_owner on public.media_albums(owner_id,updated_at desc,id);
create index if not exists idx_media_album_items_order on public.media_album_items(album_id,sort_order,media_id);

create or replace function public.intimo_set_album_media(p_album_id uuid,p_owner_id uuid,p_media_ids uuid[],p_cover_media_id uuid)
returns void language plpgsql set search_path=public as $$
declare v_count integer;
begin
  perform 1 from public.media_albums where id=p_album_id and owner_id=p_owner_id for update;
  if not found then raise exception 'album_not_found'; end if;
  if coalesce(array_length(p_media_ids,1),0) > 100 then raise exception 'album_too_large'; end if;
  select count(*) into v_count from public.media_objects
    where id=any(coalesce(p_media_ids,array[]::uuid[])) and owner_id=p_owner_id and media_type='IMAGE' and upload_status='AVAILABLE';
  if v_count <> coalesce(array_length(p_media_ids,1),0) then raise exception 'invalid_album_media'; end if;
  if p_cover_media_id is not null and not (p_cover_media_id=any(coalesce(p_media_ids,array[]::uuid[]))) then raise exception 'invalid_album_cover'; end if;
  delete from public.media_album_items where album_id=p_album_id;
  insert into public.media_album_items(album_id,media_id,sort_order)
    select p_album_id,value,ordinality-1 from unnest(coalesce(p_media_ids,array[]::uuid[])) with ordinality as selected(value,ordinality);
  update public.media_albums set cover_media_id=p_cover_media_id,moderation_status='PENDING_REVIEW',published_at=null,updated_at=now()
    where id=p_album_id and owner_id=p_owner_id;
end $$;

alter table public.media_albums enable row level security;
alter table public.media_albums force row level security;
alter table public.media_album_items enable row level security;
alter table public.media_album_items force row level security;
revoke all on table public.media_albums,public.media_album_items from anon,authenticated;
revoke all on function public.intimo_set_album_media(uuid,uuid,uuid[],uuid) from public,anon,authenticated;
commit;

-- Rollback: drop function intimo_set_album_media, media_album_items, then
-- media_albums. The legacy photo_albums table is intentionally not modified.

-- ===== 20260818_transactional_blocking.sql
-- Blocking must atomically end all social relationships in both directions.
-- Rollback: drop function public.intimo_block_profile(uuid, uuid). Existing
-- blocks and removed connections are intentionally not reconstructed.
create or replace function public.intimo_block_profile(p_blocker_id uuid, p_blocked_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_block_id uuid;
begin
  if p_blocker_id is null or p_blocked_id is null or p_blocker_id = p_blocked_id then
    raise exception 'invalid block target';
  end if;

  insert into public.user_blocks (blocker_id, blocked_profile_id)
  values (p_blocker_id, p_blocked_id)
  on conflict (blocker_id, blocked_profile_id) do update
    set blocked_profile_id = excluded.blocked_profile_id
  returning id into v_block_id;

  delete from public.connections
  where (follower_id = p_blocker_id and followed_id = p_blocked_id)
     or (follower_id = p_blocked_id and followed_id = p_blocker_id);

  return v_block_id;
end;
$$;

revoke all on function public.intimo_block_profile(uuid, uuid) from public, anon, authenticated;
grant execute on function public.intimo_block_profile(uuid, uuid) to service_role;

-- ===== 20260819_demo_content_marker.sql
-- Marks synthetic records without changing normal profile behavior.
-- This migration does not create demo content. The separate staging seed is opt-in.
-- ROLLBACK: drop index idx_profiles_is_demo, then drop profiles.is_demo.
begin;

alter table public.profiles
  add column if not exists is_demo boolean not null default false;

create index if not exists idx_profiles_is_demo
  on public.profiles(is_demo)
  where is_demo = true;

commit;

-- ===== 20260820_mutual_friendships.sql
-- Mutual, explicitly accepted friendships replace the undefined MATCHING_USERS audience.
-- FORWARD: apply after 20260818_transactional_blocking.sql.
-- ROLLBACK: change FRIENDS_ONLY values to PRIVATE, restore the former profile
-- constraints if required, then drop intimo_friend_action and friendships.

begin;

alter table public.profiles
  drop constraint if exists profiles_sensitive_fields_visibility_check,
  drop constraint if exists profiles_profile_visibility_check,
  drop constraint if exists profiles_message_permission_check;

update public.profiles set profile_visibility = 'FRIENDS_ONLY' where profile_visibility = 'MATCHING_USERS';
update public.profiles set sensitive_fields_visibility = 'FRIENDS_ONLY' where sensitive_fields_visibility = 'MATCHING_USERS';
update public.profiles set message_permission = 'FRIENDS_ONLY' where message_permission = 'MATCHING_USERS';

alter table public.profiles
  add constraint profiles_sensitive_fields_visibility_check check
    (sensitive_fields_visibility in ('EVERYONE','MEMBERS_ONLY','FRIENDS_ONLY','APPROVED_USERS','PRIVATE')),
  add constraint profiles_profile_visibility_check check
    (profile_visibility in ('EVERYONE','MEMBERS_ONLY','FRIENDS_ONLY','APPROVED_USERS','PRIVATE')),
  add constraint profiles_message_permission_check check
    (message_permission in ('EVERYONE','MEMBERS_ONLY','FRIENDS_ONLY','VERIFIED_ONLY','PRIVATE'));

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'PENDING' check (status in ('PENDING','ACCEPTED')),
  requested_at timestamptz not null default now(),
  accepted_at timestamptz,
  updated_at timestamptz not null default now(),
  check (requester_id <> addressee_id)
);
create unique index if not exists friendships_unordered_pair_unique
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index if not exists friendships_requester_idx on public.friendships(requester_id, status);
create index if not exists friendships_addressee_idx on public.friendships(addressee_id, status);
alter table public.friendships enable row level security;
alter table public.friendships force row level security;
revoke all on table public.friendships from public, anon, authenticated;

create or replace function public.intimo_friend_action(p_actor_id uuid, p_target_id uuid, p_action text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_friendship public.friendships%rowtype;
begin
  if p_actor_id is null or p_target_id is null or p_actor_id = p_target_id then
    raise exception 'invalid friendship target';
  end if;
  if exists (
    select 1 from public.user_blocks
    where (blocker_id = p_actor_id and blocked_profile_id = p_target_id)
       or (blocker_id = p_target_id and blocked_profile_id = p_actor_id)
  ) then raise exception 'friendship unavailable'; end if;

  select * into v_friendship from public.friendships
  where (requester_id = p_actor_id and addressee_id = p_target_id)
     or (requester_id = p_target_id and addressee_id = p_actor_id)
  for update;

  if p_action = 'REQUEST' then
    if v_friendship.id is null then
      insert into public.friendships(requester_id, addressee_id)
      values (p_actor_id, p_target_id);
      return 'OUTGOING';
    end if;
    if v_friendship.status = 'PENDING' and v_friendship.addressee_id = p_actor_id then
      update public.friendships set status='ACCEPTED', accepted_at=now(), updated_at=now() where id=v_friendship.id;
      return 'FRIENDS';
    end if;
  elsif p_action = 'ACCEPT' and v_friendship.status = 'PENDING' and v_friendship.addressee_id = p_actor_id then
    update public.friendships set status='ACCEPTED', accepted_at=now(), updated_at=now() where id=v_friendship.id;
    return 'FRIENDS';
  elsif p_action = 'DECLINE' and v_friendship.status = 'PENDING' and v_friendship.addressee_id = p_actor_id then
    delete from public.friendships where id=v_friendship.id;
    return 'NONE';
  elsif p_action = 'REMOVE' and v_friendship.id is not null then
    delete from public.friendships where id=v_friendship.id;
    return 'NONE';
  end if;
  raise exception 'invalid friendship transition';
end;
$$;
revoke all on function public.intimo_friend_action(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.intimo_friend_action(uuid, uuid, text) to service_role;

create or replace function public.intimo_block_profile(p_blocker_id uuid, p_blocked_id uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_block_id uuid;
begin
  if p_blocker_id is null or p_blocked_id is null or p_blocker_id = p_blocked_id then raise exception 'invalid block target'; end if;
  insert into public.user_blocks(blocker_id,blocked_profile_id) values(p_blocker_id,p_blocked_id)
  on conflict(blocker_id,blocked_profile_id) do update set blocked_profile_id=excluded.blocked_profile_id returning id into v_block_id;
  delete from public.connections where (follower_id=p_blocker_id and followed_id=p_blocked_id) or (follower_id=p_blocked_id and followed_id=p_blocker_id);
  delete from public.friendships where (requester_id=p_blocker_id and addressee_id=p_blocked_id) or (requester_id=p_blocked_id and addressee_id=p_blocker_id);
  return v_block_id;
end; $$;
revoke all on function public.intimo_block_profile(uuid, uuid) from public, anon, authenticated;
grant execute on function public.intimo_block_profile(uuid, uuid) to service_role;

commit;

-- ===== 20260821_reconcile_canonical_media_schema.sql
-- Reconcile projects that received the original media_objects table but not
-- the later public-content and canonical-album migrations.
-- Additive/idempotent: existing media rows are retained.
begin;

alter table public.media_objects
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists category text,
  add column if not exists tags jsonb not null default '[]'::jsonb,
  add column if not exists thumbnail_media_id uuid references public.media_objects(id) on delete set null,
  add column if not exists processing_status text not null default 'READY',
  add column if not exists published_at timestamptz,
  add column if not exists moderation_status text not null default 'PENDING_REVIEW';

alter table public.media_objects drop constraint if exists media_objects_processing_status_check;
alter table public.media_objects add constraint media_objects_processing_status_check check
  (processing_status in ('UPLOADING','PROCESSING','READY','FAILED','REJECTED'));

alter table public.media_objects drop constraint if exists media_objects_moderation_status_check;
update public.media_objects
set moderation_status = 'PENDING_REVIEW'
where moderation_status in ('ACTIVE','RESTORED');
alter table public.media_objects alter column moderation_status set default 'PENDING_REVIEW';
alter table public.media_objects add constraint media_objects_moderation_status_check check
  (moderation_status in ('PENDING_REVIEW','UNDER_REVIEW','APPROVED','REJECTED','HIDDEN','REMOVED'));

create index if not exists idx_media_public_feed
  on public.media_objects(media_type,visibility,moderation_status,processing_status,published_at desc,id);

create table if not exists public.media_albums (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text check (description is null or char_length(description) <= 4000),
  category text check (category is null or char_length(category) <= 100),
  tags jsonb not null default '[]'::jsonb,
  visibility text not null default 'PRIVATE' check (visibility in ('PUBLIC','MEMBERS_ONLY','FOLLOWERS_ONLY','PRIVATE')),
  moderation_status text not null default 'PENDING_REVIEW' check (moderation_status in ('PENDING_REVIEW','UNDER_REVIEW','APPROVED','REJECTED','HIDDEN','REMOVED')),
  moderator_note text,
  cover_media_id uuid references public.media_objects(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_album_items (
  album_id uuid not null references public.media_albums(id) on delete cascade,
  media_id uuid not null references public.media_objects(id) on delete cascade,
  sort_order integer not null check (sort_order >= 0),
  added_at timestamptz not null default now(),
  primary key (album_id,media_id),
  unique (album_id,sort_order)
);

create index if not exists idx_media_albums_public on public.media_albums(visibility,moderation_status,published_at desc,id);
create index if not exists idx_media_albums_owner on public.media_albums(owner_id,updated_at desc,id);
create index if not exists idx_media_album_items_order on public.media_album_items(album_id,sort_order,media_id);

create or replace function public.intimo_set_album_media(p_album_id uuid,p_owner_id uuid,p_media_ids uuid[],p_cover_media_id uuid)
returns void language plpgsql set search_path=public as $$
declare v_count integer;
begin
  perform 1 from public.media_albums where id=p_album_id and owner_id=p_owner_id for update;
  if not found then raise exception 'album_not_found'; end if;
  if coalesce(array_length(p_media_ids,1),0) > 100 then raise exception 'album_too_large'; end if;
  select count(*) into v_count from public.media_objects
    where id=any(coalesce(p_media_ids,array[]::uuid[])) and owner_id=p_owner_id and media_type='IMAGE' and upload_status='AVAILABLE';
  if v_count <> coalesce(array_length(p_media_ids,1),0) then raise exception 'invalid_album_media'; end if;
  if p_cover_media_id is not null and not (p_cover_media_id=any(coalesce(p_media_ids,array[]::uuid[]))) then raise exception 'invalid_album_cover'; end if;
  delete from public.media_album_items where album_id=p_album_id;
  insert into public.media_album_items(album_id,media_id,sort_order)
    select p_album_id,value,ordinality-1 from unnest(coalesce(p_media_ids,array[]::uuid[])) with ordinality as selected(value,ordinality);
  update public.media_albums set cover_media_id=p_cover_media_id,moderation_status='PENDING_REVIEW',published_at=null,updated_at=now()
    where id=p_album_id and owner_id=p_owner_id;
end $$;

alter table public.media_albums enable row level security;
alter table public.media_albums force row level security;
alter table public.media_album_items enable row level security;
alter table public.media_album_items force row level security;
revoke all on table public.media_albums,public.media_album_items from anon,authenticated;
revoke all on function public.intimo_set_album_media(uuid,uuid,uuid[],uuid) from public,anon,authenticated;

commit;

-- Rollback: drop intimo_set_album_media, media_album_items and media_albums.
-- The added media_objects columns should only be removed after proving no
-- application or audit record depends on them.

-- ===== 20260822_album_audience_and_interaction_rules.sql
-- Durable album audience and interaction controls for the free MVP.
begin;

alter table public.media_albums
  add column if not exists comment_policy text not null default 'MEMBERS',
  add column if not exists reactions_enabled boolean not null default true;

alter table public.media_albums drop constraint if exists media_albums_visibility_check;
alter table public.media_albums add constraint media_albums_visibility_check check
  (visibility in ('PUBLIC','MEMBERS_ONLY','FOLLOWERS_ONLY','FRIENDS_ONLY','PRIVATE'));

alter table public.media_albums drop constraint if exists media_albums_comment_policy_check;
alter table public.media_albums add constraint media_albums_comment_policy_check check
  (comment_policy in ('MEMBERS','VERIFIED','FRIENDS','DISABLED'));

create or replace function public.intimo_set_album_media(p_album_id uuid,p_owner_id uuid,p_media_ids uuid[],p_cover_media_id uuid)
returns void language plpgsql set search_path=public as $$
declare v_count integer;
begin
  perform 1 from public.media_albums where id=p_album_id and owner_id=p_owner_id for update;
  if not found then raise exception 'album_not_found'; end if;
  if coalesce(array_length(p_media_ids,1),0) > 30 then raise exception 'album_too_large'; end if;
  select count(*) into v_count from public.media_objects
    where id=any(coalesce(p_media_ids,array[]::uuid[])) and owner_id=p_owner_id and media_type='IMAGE' and upload_status='AVAILABLE';
  if v_count <> coalesce(array_length(p_media_ids,1),0) then raise exception 'invalid_album_media'; end if;
  if p_cover_media_id is not null and not (p_cover_media_id=any(coalesce(p_media_ids,array[]::uuid[]))) then raise exception 'invalid_album_cover'; end if;
  delete from public.media_album_items where album_id=p_album_id;
  insert into public.media_album_items(album_id,media_id,sort_order)
    select p_album_id,value,ordinality-1 from unnest(coalesce(p_media_ids,array[]::uuid[])) with ordinality as selected(value,ordinality);
  update public.media_albums set cover_media_id=p_cover_media_id,moderation_status='PENDING_REVIEW',published_at=null,updated_at=now()
    where id=p_album_id and owner_id=p_owner_id;
end $$;

revoke all on function public.intimo_set_album_media(uuid,uuid,uuid[],uuid) from public,anon,authenticated;
commit;

-- Rollback: restore the prior visibility constraint only after converting any
-- FRIENDS_ONLY rows, then drop comment_policy and reactions_enabled.

-- ===== 20260823_explicit_media_and_photo_verification.sql
-- Classify media so explicit content is never exposed anonymously by default.
-- Existing and unclassified rows are deliberately treated as EXPLICIT.
begin;

alter table public.media_objects
  add column if not exists content_rating text not null default 'EXPLICIT';

alter table public.media_objects drop constraint if exists media_objects_content_rating_check;
alter table public.media_objects add constraint media_objects_content_rating_check
  check (content_rating in ('EXPLICIT','NON_EXPLICIT'));

update public.media_objects
set content_rating = 'EXPLICIT'
where content_rating is null or content_rating not in ('EXPLICIT','NON_EXPLICIT');

create index if not exists idx_media_public_rating
  on public.media_objects(content_rating,media_type,visibility,moderation_status,processing_status,published_at desc,id);

commit;

-- Rollback: drop idx_media_public_rating, then drop content_rating only after
-- confirming no runtime depends on it. Rolling back re-opens anonymous media
-- ambiguity and is not recommended.

-- ===== 20261017_emergency_revoke_client_table_access.sql
-- Applied manually to production (bkdyjdbmtucqvgebqadp) on 2026-10-17 via SQL editor.
-- Production ran only the legacy bootstrap (001_initial_schema) with anon_* policies
-- granting public read/insert/update on profiles, direct_messages and other tables.
-- All tables were empty at the time (0 profiles, 0 messages, 0 auth.users).
-- The app reaches Postgres only through the server-side service role, so revoking
-- client-role table privileges closes the exposure without affecting the app.
-- The remaining anon_* policies are inert without grants and are dropped by the
-- Supabase Auth baseline migration (issue #8).
revoke all on table public.profiles, public.dating_ads, public.photo_albums, public.videos,
  public.chat_messages, public.connections, public.notifications, public.direct_messages
  from anon, authenticated;

-- ===== 20261018_supabase_auth_identity.sql
-- ADR-002: Supabase Auth replaces Auth0. profiles.id is the auth.users.id and
-- profiles.auth_id (kept for the existing query paths) must equal it.
-- No FK to auth.users: deleting a login must not cascade away moderation history;
-- account deletion is handled by the privacy lifecycle instead.
begin;

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'audit_events' and column_name = 'actor_auth0_sub') then
    alter table public.audit_events rename column actor_auth0_sub to actor_user_id;
  end if;
end $$;

alter table public.profiles drop constraint if exists profiles_auth_id_matches_id;
alter table public.profiles add constraint profiles_auth_id_matches_id check (auth_id = id::text);

comment on column public.profiles.auth_id is 'Supabase auth.users.id as text; always equals id. Retained for existing query paths.';

commit;

-- ===== record migration history
insert into supabase_migrations.schema_migrations(version, name) values
  ('20260805', 'drop_legacy_bootstrap'),
  ('20260806', 'canonical_base_schema'),
  ('20260807', 'lock_down_auth0_boundary'),
  ('20260808', 'free_mvp_privacy_foundation'),
  ('20260809', 'safety_moderation_foundation'),
  ('20260810', 'critical_compliance_controls'),
  ('20260811', 'admin_command_center'),
  ('20260812', 'super_admin_elevation'),
  ('20260813', 'internal_admin_mfa'),
  ('20260814', 'public_community_content'),
  ('20260815', 'retention_execution'),
  ('20260816', 'transactional_safety_actions'),
  ('20260817', 'canonical_media_albums'),
  ('20260818', 'transactional_blocking'),
  ('20260819', 'demo_content_marker'),
  ('20260820', 'mutual_friendships'),
  ('20260821', 'reconcile_canonical_media_schema'),
  ('20260822', 'album_audience_and_interaction_rules'),
  ('20260823', 'explicit_media_and_photo_verification'),
  ('20261017', 'emergency_revoke_client_table_access'),
  ('20261018', 'supabase_auth_identity')
on conflict (version) do nothing;

select count(*) as public_tables from pg_tables where schemaname = 'public';  -- expect 37
