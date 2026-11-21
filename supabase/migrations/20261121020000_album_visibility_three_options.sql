-- Three-option album presentation, without widening legacy audiences.
-- Preserve old FOLLOWERS_ONLY and FRIENDS_ONLY rows until their owner explicitly
-- chooses a new audience. PUBLIC becomes MEMBERS_ONLY (narrower, never wider).
BEGIN;
CREATE TABLE public.album_viewer_grants (
  album_id uuid NOT NULL REFERENCES public.media_albums(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  PRIMARY KEY (album_id, viewer_id)
);
CREATE INDEX album_viewer_grants_viewer_idx ON public.album_viewer_grants(viewer_id, album_id);
ALTER TABLE public.album_viewer_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.album_viewer_grants FROM public, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.album_viewer_grants TO service_role;
-- Previously owner-wide grants applied to approved-private albums. Transfer only
-- active grants to specific albums; never copy grants onto PRIVATE ("Only me").
INSERT INTO public.album_viewer_grants(album_id, viewer_id, expires_at)
SELECT a.id, g.viewer_id, CASE WHEN g.grant_type = 'ONCE' THEN g.expires_at ELSE null END
FROM public.media_albums a
JOIN public.album_access_grants g ON g.owner_id = a.owner_id
WHERE a.visibility = 'PRIVATE_APPROVED' AND a.moderation_status <> 'REMOVED'
 AND g.status='GRANTED' AND (g.expires_at IS NULL OR g.expires_at > now())
ON CONFLICT DO NOTHING;
UPDATE public.media_albums SET visibility='MEMBERS_ONLY', updated_at=now()
WHERE visibility='PUBLIC' AND moderation_status <> 'REMOVED';
COMMIT;
