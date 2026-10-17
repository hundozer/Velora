-- Canonical Intimo free-MVP base schema for new environments.
-- Auth0 is the identity provider: no local password table is created.
-- Browser roles receive no grants or permissive policies.
begin;
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(), auth_id text unique not null, email text unique not null,
  display_name text not null default 'Member', username text, role text not null default 'MEMBER',
  member_tier text not null default 'FREE', verification_status text not null default 'UNVERIFIED', verification_level text,
  avatar_url text, cover_photo_url text, date_of_birth text, age integer check (age is null or age >= 18),
  gender text, sexual_orientation text, country text default '', city text default '', location text default '',
  languages jsonb not null default '["English"]'::jsonb, headline text, bio text,
  interests jsonb not null default '[]'::jsonb, lifestyle_tags jsonb not null default '[]'::jsonb,
  hobbies jsonb not null default '[]'::jsonb, relationship_status text, looking_for jsonb not null default '[]'::jsonb,
  is_couple_profile boolean not null default false, partner_display_name text, partner_age integer check (partner_age is null or partner_age >= 18), partner_gender text,
  pubic_hair_grooming text, piercing text, tattoo text, erogenous_zones jsonb not null default '[]'::jsonb,
  favourite_sex_places jsonb not null default '[]'::jsonb, favourite_sex_positions jsonb not null default '[]'::jsonb,
  sex_hobbies jsonb not null default '[]'::jsonb, categories jsonb not null default '[]'::jsonb,
  monthly_subscription_price numeric, followers_count integer not null default 0, subscribers_count integer not null default 0,
  total_content_count integer not null default 0, public_profile_visibility boolean not null default false,
  photo_visibility_default text not null default 'PRIVATE', location_precision text not null default 'CITY',
  show_online_status boolean not null default false, show_distance boolean not null default false,
  allow_direct_messages boolean not null default false, require_verification_to_message boolean not null default true,
  gallery_images jsonb not null default '[]'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists idx_profiles_auth_id on public.profiles(auth_id);
create index if not exists idx_profiles_email on public.profiles(email);

create table if not exists public.dating_ads (
  id uuid primary key default gen_random_uuid(), author_id uuid not null references public.profiles(id) on delete cascade,
  author_name text not null, author_avatar text, is_verified boolean not null default false, category text not null,
  title text not null, text text not null, photo_url text, validity_days integer not null default 7,
  country text, region text, allowed_reply_genders jsonb not null default '[]'::jsonb, transgender_option text,
  min_age integer not null default 18 check (min_age >= 18), max_age integer not null default 100,
  require_vip boolean not null default false, require_media boolean not null default false,
  require_verified boolean not null default false, status text not null default 'active', created_at timestamptz not null default now()
);
create index if not exists idx_dating_ads_author on public.dating_ads(author_id);

create table if not exists public.photo_albums (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, description text, cover_url text, photos jsonb not null default '[]'::jsonb,
  photo_count integer not null default 0, monetization text not null default 'FREE', credits_price integer,
  category text, topics jsonb not null default '[]'::jsonb, views integer not null default 0,
  comments integer not null default 0, likes integer not null default 0, status text not null default 'On web', created_at timestamptz not null default now()
);
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, description text, video_url text, thumbnail_url text, duration text,
  monetization text not null default 'FREE', credits_price integer, category text, comment_permission text not null default 'ANYONE',
  voting_permission text not null default 'ANYONE', topics jsonb not null default '[]'::jsonb,
  views integer not null default 0, comments integer not null default 0, likes integer not null default 0,
  status text not null default 'On web', created_at timestamptz not null default now()
);
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(), room_id text not null, sender_id uuid references public.profiles(id) on delete set null,
  sender_name text not null, sender_avatar text, sender_gender text, content text not null, created_at timestamptz not null default now()
);
create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(), follower_id uuid not null references public.profiles(id) on delete cascade,
  followed_id uuid not null references public.profiles(id) on delete cascade, connection_type text not null default 'follow',
  created_at timestamptz not null default now(), unique(follower_id,followed_id,connection_type), check(follower_id <> followed_id)
);
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null, title text not null, message text not null, actor_name text, actor_avatar text,
  target_link text, is_read boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(), conversation_id text not null,
  sender_id uuid references public.profiles(id) on delete set null, receiver_id uuid references public.profiles(id) on delete set null,
  sender_name text not null, sender_avatar text, content text not null, media_url text, attachment_type text,
  is_disappearing boolean not null default false, disappear_timer_sec integer, is_opened boolean not null default false,
  status text not null default 'SENT', is_locked boolean not null default false, unlock_price numeric,
  is_unlocked boolean not null default false, created_at timestamptz not null default now()
);

create index if not exists idx_dm_conversation on public.direct_messages(conversation_id,created_at desc);
create index if not exists idx_connections_follower on public.connections(follower_id);
create index if not exists idx_connections_followed on public.connections(followed_id);
create index if not exists idx_notifications_user on public.notifications(user_id,created_at desc);

alter table public.profiles enable row level security; alter table public.dating_ads enable row level security;
alter table public.photo_albums enable row level security; alter table public.videos enable row level security;
alter table public.chat_messages enable row level security; alter table public.connections enable row level security;
alter table public.notifications enable row level security; alter table public.direct_messages enable row level security;
revoke all on table public.profiles, public.dating_ads, public.photo_albums, public.videos, public.chat_messages, public.connections, public.notifications, public.direct_messages from anon, authenticated;
commit;
