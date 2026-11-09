-- Store Resend's provider acknowledgement for operational troubleshooting.
-- Acceptance is NOT proof of inbox delivery; avoid putting recipient email in the ledger.
alter table public.member_email_invites
  add column if not exists provider_message_id text;
create unique index if not exists member_email_invites_provider_id_unique
  on public.member_email_invites(provider_message_id)
  where provider_message_id is not null;
