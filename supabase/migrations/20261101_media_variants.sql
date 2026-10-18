-- Image variants for fast, cacheable photography (editorial redesign, Phase 1).
-- Resized WebP copies are written to R2 under variants/{media_id}/{width}.webp when an
-- image upload completes (or by scripts/backfill-media-variants.mjs). The original stays
-- untouched and authorisation is unchanged: variants are only ever served through
-- /api/media/{id}?w=..., which runs the same visibility, block and grant checks.
-- Additive and idempotent. The app works before this is applied (variants are skipped).
-- Rollback: alter table public.media_objects drop column if exists variants,
--   drop column if exists dominant_color, drop column if exists lqip,
--   drop column if exists variants_status;

alter table public.media_objects add column if not exists variants jsonb;
alter table public.media_objects add column if not exists dominant_color text
  check (dominant_color is null or dominant_color ~ '^#[0-9a-f]{6}$');
alter table public.media_objects add column if not exists lqip text
  check (lqip is null or (lqip like 'data:image/webp;base64,%' and length(lqip) <= 2048));
alter table public.media_objects add column if not exists variants_status text
  check (variants_status is null or variants_status in ('READY','FAILED','SKIPPED'));

-- Backfill and monitoring look for images without variants.
create index if not exists media_objects_variants_pending_idx
  on public.media_objects (created_at)
  where media_type = 'IMAGE' and upload_status = 'AVAILABLE' and variants_status is null;
