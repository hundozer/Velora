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
