-- FM: one-time private chat image access. Additive, reversible only if no view-once messages exist.
-- ROLLBACK:
-- ALTER TABLE public.direct_messages DROP CONSTRAINT IF EXISTS direct_messages_view_once_image_check;
-- ALTER TABLE public.direct_messages DROP COLUMN IF EXISTS view_once_opened_at;
-- ALTER TABLE public.direct_messages DROP COLUMN IF EXISTS view_once;
ALTER TABLE public.direct_messages
 ADD COLUMN IF NOT EXISTS view_once boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS view_once_opened_at timestamptz;
ALTER TABLE public.direct_messages DROP CONSTRAINT IF EXISTS direct_messages_view_once_image_check;
ALTER TABLE public.direct_messages ADD CONSTRAINT direct_messages_view_once_image_check
 CHECK (NOT view_once OR (attachment_type='IMAGE' AND media_url IS NOT NULL));
CREATE INDEX IF NOT EXISTS direct_messages_view_once_unopened_idx
 ON public.direct_messages(receiver_id,id) WHERE view_once=true AND view_once_opened_at IS NULL;
