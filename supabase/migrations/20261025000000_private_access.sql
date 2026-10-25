-- P1-06 Private Album Handshake. One grant row per owner/viewer pair covers the
-- owner's PRIVATE-visibility photos. ONCE grants expire after 24 h; UNTIL_REVOKED
-- grants last until the owner revokes. Every media read re-checks the grant, so
-- revoking takes effect immediately.
-- Additive and idempotent. Rollback: drop table public.album_access_grants;

create table if not exists public.album_access_grants (
  owner_id uuid not null references public.profiles(id) on delete cascade,
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'REQUESTED' check (status in ('REQUESTED', 'GRANTED', 'DENIED', 'REVOKED')),
  grant_type text check (grant_type in ('ONCE', 'UNTIL_REVOKED')),
  expires_at timestamptz,
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  primary key (owner_id, viewer_id),
  check (owner_id <> viewer_id),
  check (status <> 'GRANTED' or grant_type is not null),
  check (grant_type is distinct from 'ONCE' or expires_at is not null)
);
create index if not exists album_access_grants_viewer_idx on public.album_access_grants (viewer_id, status);
create index if not exists album_access_grants_owner_idx on public.album_access_grants (owner_id, status, requested_at desc);

alter table public.album_access_grants enable row level security;
revoke all on public.album_access_grants from anon, authenticated;
grant select on public.album_access_grants to authenticated;
drop policy if exists album_access_grants_read_own on public.album_access_grants;
create policy album_access_grants_read_own on public.album_access_grants for select to authenticated using (owner_id = auth.uid() or viewer_id = auth.uid());
