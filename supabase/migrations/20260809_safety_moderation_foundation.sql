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
