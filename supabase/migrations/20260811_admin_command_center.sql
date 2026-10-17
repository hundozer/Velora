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
