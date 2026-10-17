-- Canonical albums group media_objects without duplicating storage URLs.
-- Apply after 20260816 in a backed-up staging project first.
begin;

create table if not exists public.media_albums (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text check (description is null or char_length(description) <= 4000),
  category text check (category is null or char_length(category) <= 100),
  tags jsonb not null default '[]'::jsonb,
  visibility text not null default 'PRIVATE' check (visibility in ('PUBLIC','MEMBERS_ONLY','FOLLOWERS_ONLY','PRIVATE')),
  moderation_status text not null default 'PENDING_REVIEW' check (moderation_status in ('PENDING_REVIEW','UNDER_REVIEW','APPROVED','REJECTED','HIDDEN','REMOVED')),
  moderator_note text,
  cover_media_id uuid references public.media_objects(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_album_items (
  album_id uuid not null references public.media_albums(id) on delete cascade,
  media_id uuid not null references public.media_objects(id) on delete cascade,
  sort_order integer not null check (sort_order >= 0),
  added_at timestamptz not null default now(),
  primary key (album_id, media_id),
  unique (album_id, sort_order)
);

create index if not exists idx_media_albums_public on public.media_albums(visibility,moderation_status,published_at desc,id);
create index if not exists idx_media_albums_owner on public.media_albums(owner_id,updated_at desc,id);
create index if not exists idx_media_album_items_order on public.media_album_items(album_id,sort_order,media_id);

create or replace function public.intimo_set_album_media(p_album_id uuid,p_owner_id uuid,p_media_ids uuid[],p_cover_media_id uuid)
returns void language plpgsql set search_path=public as $$
declare v_count integer;
begin
  perform 1 from public.media_albums where id=p_album_id and owner_id=p_owner_id for update;
  if not found then raise exception 'album_not_found'; end if;
  if coalesce(array_length(p_media_ids,1),0) > 100 then raise exception 'album_too_large'; end if;
  select count(*) into v_count from public.media_objects
    where id=any(coalesce(p_media_ids,array[]::uuid[])) and owner_id=p_owner_id and media_type='IMAGE' and upload_status='AVAILABLE';
  if v_count <> coalesce(array_length(p_media_ids,1),0) then raise exception 'invalid_album_media'; end if;
  if p_cover_media_id is not null and not (p_cover_media_id=any(coalesce(p_media_ids,array[]::uuid[]))) then raise exception 'invalid_album_cover'; end if;
  delete from public.media_album_items where album_id=p_album_id;
  insert into public.media_album_items(album_id,media_id,sort_order)
    select p_album_id,value,ordinality-1 from unnest(coalesce(p_media_ids,array[]::uuid[])) with ordinality as selected(value,ordinality);
  update public.media_albums set cover_media_id=p_cover_media_id,moderation_status='PENDING_REVIEW',published_at=null,updated_at=now()
    where id=p_album_id and owner_id=p_owner_id;
end $$;

alter table public.media_albums enable row level security;
alter table public.media_albums force row level security;
alter table public.media_album_items enable row level security;
alter table public.media_album_items force row level security;
revoke all on table public.media_albums,public.media_album_items from anon,authenticated;
revoke all on function public.intimo_set_album_media(uuid,uuid,uuid[],uuid) from public,anon,authenticated;
commit;

-- Rollback: drop function intimo_set_album_media, media_album_items, then
-- media_albums. The legacy photo_albums table is intentionally not modified.
