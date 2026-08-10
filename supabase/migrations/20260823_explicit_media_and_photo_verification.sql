-- Classify media so explicit content is never exposed anonymously by default.
-- Existing and unclassified rows are deliberately treated as EXPLICIT.
begin;

alter table public.media_objects
  add column if not exists content_rating text not null default 'EXPLICIT';

alter table public.media_objects drop constraint if exists media_objects_content_rating_check;
alter table public.media_objects add constraint media_objects_content_rating_check
  check (content_rating in ('EXPLICIT','NON_EXPLICIT'));

update public.media_objects
set content_rating = 'EXPLICIT'
where content_rating is null or content_rating not in ('EXPLICIT','NON_EXPLICIT');

create index if not exists idx_media_public_rating
  on public.media_objects(content_rating,media_type,visibility,moderation_status,processing_status,published_at desc,id);

commit;

-- Rollback: drop idx_media_public_rating, then drop content_rating only after
-- confirming no runtime depends on it. Rolling back re-opens anonymous media
-- ambiguity and is not recommended.
