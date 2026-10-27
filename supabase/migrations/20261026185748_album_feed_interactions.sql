-- Albums are feed posts and use the same member-only reaction/comment tables.
begin;
alter table public.content_comments drop constraint content_comments_target_type_check;
alter table public.content_comments add constraint content_comments_target_type_check check (target_type in ('MEDIA','POST','DATING_AD','ALBUM'));
alter table public.content_reactions drop constraint content_reactions_target_type_check;
alter table public.content_reactions add constraint content_reactions_target_type_check check (target_type in ('MEDIA','POST','DATING_AD','COMMENT','ALBUM'));
commit;
