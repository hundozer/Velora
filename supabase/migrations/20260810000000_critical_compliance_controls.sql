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
