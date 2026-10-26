-- Keep the Prague pilot intact while adding permanent community rooms and member rooms.
begin;
create table public.rooms (
  id text primary key check (id ~ '^[a-z0-9-]{1,64}$'),
  title text not null check (length(title) between 3 and 80),
  description text not null check (length(description) between 1 and 500),
  creator_id uuid references public.profiles(id) on delete cascade,
  builtin boolean not null default false,
  locked boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  constraint room_lifetime check ((builtin and creator_id is null and expires_at is null and not locked) or (not builtin and creator_id is not null)),
  constraint room_30_day_lifetime check (expires_at is null or expires_at = created_at + interval '30 days')
);
insert into public.rooms(id,title,description,builtin) values
  ('prague','Prague Room','The city-wide conversation. Say hello, talk about the scene, or find company.',true),
  ('introductions','Introductions','Meet the people here. Share what you are looking for and what feels good to you.',true),
  ('tonight','Tonight','Plans, possibilities and who is around in Prague tonight.',true);
create table public.room_members (
  room_id text not null references public.rooms(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key(room_id,profile_id)
);
alter table public.room_messages drop constraint room_messages_room_id_check;
alter table public.room_messages add constraint room_messages_room_id_fkey foreign key (room_id) references public.rooms(id) on delete cascade;
alter table public.room_presence drop constraint room_presence_room_id_check;
alter table public.room_presence drop constraint room_presence_pkey;
alter table public.room_presence add constraint room_presence_pkey primary key (room_id, profile_id);
alter table public.room_presence add constraint room_presence_room_id_fkey foreign key (room_id) references public.rooms(id) on delete cascade;
create index room_members_profile on public.room_members(profile_id,room_id);
create index rooms_active on public.rooms(expires_at,created_at desc);
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
revoke all on public.rooms, public.room_members from public, anon, authenticated;
grant select, insert, update, delete on public.rooms, public.room_members to service_role;
commit;
