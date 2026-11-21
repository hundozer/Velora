-- Revoke scoped approvals whenever an album stops being Private.
-- This prevents stale approval resurrection after Only me -> Private toggles.
BEGIN;
CREATE OR REPLACE FUNCTION public.intimo_revoke_album_viewers_on_audience_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.visibility IS DISTINCT FROM OLD.visibility AND OLD.visibility = 'PRIVATE_APPROVED' THEN
    DELETE FROM public.album_viewer_grants WHERE album_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.intimo_revoke_album_viewers_on_audience_change() FROM public, anon, authenticated;
DROP TRIGGER IF EXISTS trg_intimo_album_revoke_viewers ON public.media_albums;
CREATE TRIGGER trg_intimo_album_revoke_viewers AFTER UPDATE OF visibility ON public.media_albums
FOR EACH ROW EXECUTE FUNCTION public.intimo_revoke_album_viewers_on_audience_change();
COMMIT;
