-- FM-06: age check at activation.
-- A member is let in only after an admin has reviewed a selfie holding a one-time code
-- (both partners for a couple), or has approved them by hand with a written reason.
-- Additive only: two profile columns for the current code, one column on the review that
-- records which code was asked for, a PENDING age status, and one open age check per member.
-- No existing row changes. Existing AGE_DECLARED members lose community access when the code
-- ships, so approve them (APPROVE_AGE, or the owner-approved backfill in supabase/APPLIED.md)
-- BEFORE merging the code.
--
-- ROLLBACK (only after moving any PENDING profiles back to AGE_DECLARED):
--   drop index if exists public.verification_reviews_one_open_age_check;
--   alter table public.verification_reviews drop column if exists challenge_code;
--   alter table public.profiles drop column if exists age_check_code_issued_at,
--     drop column if exists age_check_code;
--   alter table public.profiles drop constraint if exists profiles_age_verification_status_check,
--     add constraint profiles_age_verification_status_check check
--     (age_verification_status in ('UNVERIFIED','AGE_DECLARED','AGE_VERIFIED','FAILED','REVIEW_REQUIRED'));

alter table public.profiles
  add column if not exists age_check_code text
    check (age_check_code is null or age_check_code ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$'),
  add column if not exists age_check_code_issued_at timestamptz;

alter table public.profiles
  drop constraint if exists profiles_age_verification_status_check,
  add constraint profiles_age_verification_status_check check
    (age_verification_status in ('UNVERIFIED','AGE_DECLARED','PENDING','AGE_VERIFIED','FAILED','REVIEW_REQUIRED'));

alter table public.verification_reviews
  add column if not exists challenge_code text
    check (challenge_code is null or challenge_code ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$');

-- One open age check per member, so a double submit can't queue two reviews.
create unique index if not exists verification_reviews_one_open_age_check
  on public.verification_reviews (profile_id)
  where verification_type = 'AGE' and status in ('PENDING', 'REVIEW_REQUIRED');
