-- A heartbeat means the member has this room open, not merely that they used Intimo.
begin;
create table public.room_presence (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  room_id text not null default 'prague' check (room_id = 'prague'),
  last_seen_at timestamptz not null default now()
);
create index room_presence_recent on public.room_presence(room_id, last_seen_at desc);
alter table public.room_presence enable row level security;
revoke all on public.room_presence from public, anon, authenticated;
grant select, insert, update, delete on public.room_presence to service_role;
commit;
