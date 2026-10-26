-- Single Prague room pilot. Server mediates every read and write; no client table grants.
begin;
create table public.room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id text not null default 'prague' check (room_id = 'prague'),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(body) between 1 and 500),
  status text not null default 'VISIBLE' check (status in ('VISIBLE','REMOVED')),
  created_at timestamptz not null default now()
);
create index room_messages_recent on public.room_messages(room_id, created_at desc, id desc);
alter table public.room_messages enable row level security;
revoke all on public.room_messages from public, anon, authenticated;
grant all on public.room_messages to service_role;
commit;
