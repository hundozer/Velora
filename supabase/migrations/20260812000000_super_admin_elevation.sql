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
