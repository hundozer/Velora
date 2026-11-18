-- FM-09: optional identity details in a member's own words, each with its own audience.
-- Additive only. Existing rows keep working: empty notes, no pronouns, and an empty
-- identity_visibility map (orientation then falls back to sensitive_fields_visibility).
-- Orientation and the two notes are covered by the SPECIAL_CATEGORY_PROFILE consent
-- (src/lib/privacy/consents.mjs): withdrawing it clears them. Pronouns are not
-- special-category data and are kept until the member removes them.
--
-- ROLLBACK:
--   alter table public.profiles
--     drop constraint if exists profiles_identity_visibility_check,
--     drop column if exists identity_visibility,
--     drop column if exists pronouns,
--     drop column if exists gender_note,
--     drop column if exists orientation_note;

alter table public.profiles
  add column if not exists orientation_note text
    check (orientation_note is null or char_length(orientation_note) between 1 and 60),
  add column if not exists gender_note text
    check (gender_note is null or char_length(gender_note) between 1 and 60),
  add column if not exists pronouns text
    check (pronouns is null or char_length(pronouns) between 1 and 24),
  add column if not exists identity_visibility jsonb not null default '{}'::jsonb;

-- Only the three known keys, each with one of the three audiences.
alter table public.profiles drop constraint if exists profiles_identity_visibility_check;
alter table public.profiles add constraint profiles_identity_visibility_check check (
  jsonb_typeof(identity_visibility) = 'object'
  and identity_visibility - array['orientation', 'gender_note', 'pronouns'] = '{}'::jsonb
  and coalesce(identity_visibility->>'orientation', 'PRIVATE') in ('MEMBERS_ONLY', 'FRIENDS_ONLY', 'PRIVATE')
  and coalesce(identity_visibility->>'gender_note', 'PRIVATE') in ('MEMBERS_ONLY', 'FRIENDS_ONLY', 'PRIVATE')
  and coalesce(identity_visibility->>'pronouns', 'PRIVATE') in ('MEMBERS_ONLY', 'FRIENDS_ONLY', 'PRIVATE')
);

comment on column public.profiles.orientation_note is 'FM-09: orientation in the member''s own words (consent: SPECIAL_CATEGORY_PROFILE).';
comment on column public.profiles.gender_note is 'FM-09: gender in the member''s own words (consent: SPECIAL_CATEGORY_PROFILE).';
comment on column public.profiles.pronouns is 'FM-09: pronouns as the member writes them.';
comment on column public.profiles.identity_visibility is 'FM-09: audience per detail: {orientation, gender_note, pronouns} -> MEMBERS_ONLY | FRIENDS_ONLY | PRIVATE.';
