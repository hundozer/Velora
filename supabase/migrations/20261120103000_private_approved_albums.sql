-- Private albums for people already granted access to the owner's private photos.
-- Keep PRIVATE (owner-only album) unchanged. New PRIVATE_APPROVED albums never
-- enter the public/member/feed listings and require the existing active grant.
BEGIN;
ALTER TABLE public.media_albums DROP CONSTRAINT IF EXISTS media_albums_visibility_check;
ALTER TABLE public.media_albums ADD CONSTRAINT media_albums_visibility_check
 CHECK (visibility IN ('PUBLIC','MEMBERS_ONLY','FOLLOWERS_ONLY','FRIENDS_ONLY','PRIVATE','PRIVATE_APPROVED'));
COMMIT;
-- Rollback (only after converting PRIVATE_APPROVED albums to PRIVATE):
-- ALTER TABLE public.media_albums DROP CONSTRAINT media_albums_visibility_check;
-- ALTER TABLE public.media_albums ADD CONSTRAINT media_albums_visibility_check
-- CHECK (visibility IN ('PUBLIC','MEMBERS_ONLY','FOLLOWERS_ONLY','FRIENDS_ONLY','PRIVATE'));
