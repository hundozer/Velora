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
