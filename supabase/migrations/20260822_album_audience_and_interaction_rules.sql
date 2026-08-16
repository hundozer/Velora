-- Durable album audience and interaction controls for the free MVP.
begin;

alter table public.media_albums
  add column if not exists comment_policy text not null default 'MEMBERS',
  add column if not exists reactions_enabled boolean not null default true;

alter table public.media_albums drop constraint if exists media_albums_visibility_check;
alter table public.media_albums add constraint media_albums_visibility_check check
  (visibility in ('PUBLIC','MEMBERS_ONLY','FOLLOWERS_ONLY','FRIENDS_ONLY','PRIVATE'));

alter table public.media_albums drop constraint if exists media_albums_comment_policy_check;
alter table public.media_albums add constraint media_albums_comment_policy_check check
  (comment_policy in ('MEMBERS','VERIFIED','FRIENDS','DISABLED'));

create or replace function public.intimo_set_album_media(p_album_id uuid,p_owner_id uuid,p_media_ids uuid[],p_cover_media_id uuid)
returns void language plpgsql set search_path=public as $$
declare v_count integer;
begin
  perform 1 from public.media_albums where id=p_album_id and owner_id=p_owner_id for update;
  if not found then raise exception 'album_not_found'; end if;
  if coalesce(array_length(p_media_ids,1),0) > 30 then raise exception 'album_too_large'; end if;
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

revoke all on function public.intimo_set_album_media(uuid,uuid,uuid[],uuid) from public,anon,authenticated;
commit;

-- Rollback: restore the prior visibility constraint only after converting any
-- FRIENDS_ONLY rows, then drop comment_policy and reactions_enabled.
