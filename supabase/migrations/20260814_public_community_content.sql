-- Durable content and interaction foundation for the free public-community MVP.
-- Apply after 20260813 in staging first. This is additive and does not grant
-- browser roles direct database access. Rollback notes are at the end.
begin;

alter table public.media_objects
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists category text,
  add column if not exists tags jsonb not null default '[]'::jsonb,
  add column if not exists thumbnail_media_id uuid references public.media_objects(id) on delete set null,
  add column if not exists processing_status text not null default 'READY',
  add column if not exists published_at timestamptz;

alter table public.media_objects drop constraint if exists media_objects_processing_status_check;
alter table public.media_objects add constraint media_objects_processing_status_check check
  (processing_status in ('UPLOADING','PROCESSING','READY','FAILED','REJECTED'));

alter table public.media_objects drop constraint if exists media_objects_moderation_status_check;
-- Legacy ACTIVE rows were not approved through a durable moderation workflow.
-- Fail closed rather than treating them as public approvals.
update public.media_objects
set moderation_status = 'PENDING_REVIEW'
where moderation_status in ('ACTIVE','RESTORED');
alter table public.media_objects alter column moderation_status set default 'PENDING_REVIEW';
alter table public.media_objects add constraint media_objects_moderation_status_check check
  (moderation_status in ('PENDING_REVIEW','UNDER_REVIEW','APPROVED','REJECTED','HIDDEN','REMOVED'));

create index if not exists idx_media_public_feed
  on public.media_objects(media_type, visibility, moderation_status, processing_status, published_at desc, id);

create table if not exists public.content_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  post_type text not null check (post_type in ('TEXT_POST','FORUM_POST','STORY')),
  title text,
  body text not null,
  category text,
  tags jsonb not null default '[]'::jsonb,
  visibility text not null default 'MEMBERS_ONLY' check (visibility in ('PUBLIC','MEMBERS_ONLY','FOLLOWERS_ONLY','PRIVATE')),
  moderation_status text not null default 'PENDING_REVIEW' check (moderation_status in ('PENDING_REVIEW','UNDER_REVIEW','APPROVED','REJECTED','HIDDEN','REMOVED')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_content_posts_feed on public.content_posts(visibility, moderation_status, published_at desc, id);
create index if not exists idx_content_posts_author on public.content_posts(author_id, created_at desc);

create table if not exists public.content_comments (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('MEDIA','POST','DATING_AD')),
  target_id uuid not null,
  body text not null check (char_length(body) between 1 and 2000),
  moderation_status text not null default 'VISIBLE' check (moderation_status in ('VISIBLE','UNDER_REVIEW','HIDDEN','REMOVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_content_comments_target on public.content_comments(target_type, target_id, created_at, id);
create index if not exists idx_content_comments_author on public.content_comments(author_id, created_at desc);

create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('PROFILE','MEDIA','POST','DATING_AD')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  unique(profile_id, target_type, target_id)
);
create index if not exists idx_saved_items_profile on public.saved_items(profile_id, created_at desc);

create table if not exists public.content_reactions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('MEDIA','POST','DATING_AD','COMMENT')),
  target_id uuid not null,
  reaction text not null default 'LIKE' check (reaction in ('LIKE')),
  created_at timestamptz not null default now(),
  unique(profile_id, target_type, target_id, reaction)
);
create index if not exists idx_content_reactions_target on public.content_reactions(target_type, target_id, created_at desc);

alter table public.content_posts enable row level security;
alter table public.content_posts force row level security;
alter table public.content_comments enable row level security;
alter table public.content_comments force row level security;
alter table public.saved_items enable row level security;
alter table public.saved_items force row level security;
alter table public.content_reactions enable row level security;
alter table public.content_reactions force row level security;
revoke all on table public.content_posts, public.content_comments, public.saved_items, public.content_reactions from anon, authenticated;

commit;

-- Rollback: drop content_reactions, saved_items, content_comments and
-- content_posts in that order. Media columns may be dropped only after proving
-- no application or audit record depends on them. Never restore ACTIVE as a
-- synonym for public moderation approval.
