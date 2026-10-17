-- P1-07 Tonight / Plans. dating_ads becomes Plans: six intent categories,
-- 24 h / 72 h / 7 d expiry, a Prague area, and post-moderation of a member's
-- first Plan. Replies to a Plan are tagged on direct_messages.plan_id.
-- dating_ads had 0 rows in production when this was written, so the new
-- category and expiry constraints apply to every row.
-- Rollback: drop the added columns and constraints below
--   (direct_messages.plan_id, dating_ads.expires_at/area_id/moderation_status,
--    dating_ads_plan_category_check, dating_ads_plan_validity_check).

alter table public.dating_ads add column if not exists expires_at timestamptz;
update public.dating_ads set expires_at = created_at + make_interval(days => validity_days) where expires_at is null;
alter table public.dating_ads alter column expires_at set default now() + interval '1 day';
alter table public.dating_ads alter column expires_at set not null;

alter table public.dating_ads add column if not exists area_id text references public.areas(id) on update cascade on delete set null;
alter table public.dating_ads add column if not exists moderation_status text not null default 'APPROVED';

alter table public.dating_ads drop constraint if exists dating_ads_moderation_status_check;
alter table public.dating_ads add constraint dating_ads_moderation_status_check check (moderation_status in ('PENDING_REVIEW', 'APPROVED', 'REJECTED'));
alter table public.dating_ads drop constraint if exists dating_ads_plan_category_check;
alter table public.dating_ads add constraint dating_ads_plan_category_check check (category in ('DATE', 'CASUAL', 'COUPLES', 'KINK', 'PARTY', 'CHAT'));
alter table public.dating_ads drop constraint if exists dating_ads_plan_validity_check;
alter table public.dating_ads add constraint dating_ads_plan_validity_check check (validity_days in (1, 3, 7));
alter table public.dating_ads drop constraint if exists dating_ads_age_range_check;
alter table public.dating_ads add constraint dating_ads_age_range_check check (min_age >= 18 and max_age <= 120 and min_age <= max_age);
alter table public.dating_ads alter column max_age set default 99;

create index if not exists dating_ads_live_idx on public.dating_ads (expires_at desc) where status = 'active';
create index if not exists dating_ads_author_idx on public.dating_ads (author_id, created_at desc);

alter table public.direct_messages add column if not exists plan_id uuid references public.dating_ads(id) on delete set null;

-- Plans stay server-mediated: no member or anon grants (unchanged).
revoke all on public.dating_ads from anon, authenticated;
