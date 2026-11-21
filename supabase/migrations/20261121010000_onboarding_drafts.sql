-- Optional pre-profile onboarding drafts. All fields are ciphertext encrypted in the API.
-- No browser role may read or write drafts using the Supabase Data API.
create table public.onboarding_drafts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ciphertext text not null,
  nonce text not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  constraint onboarding_draft_ciphertext_size check (octet_length(ciphertext) <= 16384),
  constraint onboarding_draft_nonce_size check (length(nonce) <= 40)
);
create index onboarding_drafts_expiry_idx on public.onboarding_drafts(expires_at);
alter table public.onboarding_drafts enable row level security;
revoke all on public.onboarding_drafts from public, anon, authenticated;
grant select, insert, update, delete on public.onboarding_drafts to service_role;

-- Physical deletion is scheduled daily; expired drafts are already unavailable
-- immediately at read time. The job removes ciphertext within 24h of expiry.
select cron.schedule(
  'intimo-onboarding-drafts-purge',
  '15 3 * * *',
  $job$delete from public.onboarding_drafts where expires_at <= now()$job$
);
