-- Real Postgres 16 integration for album visibility migration and RLS.
-- Self-contained fixtures; run only in disposable CI database.
\set ON_ERROR_STOP on
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role; END IF;
END $$;
CREATE TABLE public.profiles(id uuid primary key);
CREATE TABLE public.media_albums(
  id uuid primary key, owner_id uuid not null references public.profiles(id),
  visibility text not null, moderation_status text not null, updated_at timestamptz default now()
);
CREATE TABLE public.album_access_grants(
  owner_id uuid not null, viewer_id uuid not null, status text not null,
  grant_type text, expires_at timestamptz
);
INSERT INTO public.profiles VALUES
('00000000-0000-4000-8000-000000000001'),
('00000000-0000-4000-8000-000000000002'),
('00000000-0000-4000-8000-000000000003');
INSERT INTO public.media_albums(id,owner_id,visibility,moderation_status) VALUES
('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','PUBLIC','APPROVED'),
('10000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000001','FOLLOWERS_ONLY','APPROVED'),
('10000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000001','FRIENDS_ONLY','APPROVED'),
('10000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000001','PRIVATE_APPROVED','APPROVED'),
('10000000-0000-4000-8000-000000000005','00000000-0000-4000-8000-000000000001','PRIVATE','APPROVED');
INSERT INTO public.album_access_grants VALUES
('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','GRANTED','UNTIL_REVOKED',null),
('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000003','GRANTED','ONCE','2000-01-01');
\i supabase/migrations/20261121020000_album_visibility_three_options.sql
\i supabase/migrations/20261121020100_album_scope_grant_invalidation.sql
DO $verify$
DECLARE n integer;
BEGIN
 IF (SELECT visibility FROM public.media_albums WHERE id='10000000-0000-4000-8000-000000000001')<>'MEMBERS_ONLY'
 THEN RAISE EXCEPTION 'Public audience not narrowed'; END IF;
 IF (SELECT visibility FROM public.media_albums WHERE id='10000000-0000-4000-8000-000000000002')<>'FOLLOWERS_ONLY'
 OR (SELECT visibility FROM public.media_albums WHERE id='10000000-0000-4000-8000-000000000003')<>'FRIENDS_ONLY'
 THEN RAISE EXCEPTION 'Legacy audience expanded'; END IF;
 SELECT count(*) INTO n FROM public.album_viewer_grants;
 IF n<>1 THEN RAISE EXCEPTION 'Expected exactly one active migrated grant, got %',n; END IF;
 SELECT count(*) INTO n FROM public.album_viewer_grants WHERE album_id='10000000-0000-4000-8000-000000000005';
 IF n<>0 THEN RAISE EXCEPTION 'Only me inherited a grant'; END IF;
 IF has_table_privilege('anon','public.album_viewer_grants','select')
 OR has_table_privilege('authenticated','public.album_viewer_grants','select')
 OR has_table_privilege('authenticated','public.album_viewer_grants','insert')
 OR NOT has_table_privilege('service_role','public.album_viewer_grants','select')
 THEN RAISE EXCEPTION 'Incorrect grant boundary'; END IF;
 IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.album_viewer_grants'::regclass)
 THEN RAISE EXCEPTION 'RLS not enabled'; END IF;
END $verify$;
UPDATE public.media_albums SET visibility='PRIVATE' WHERE id='10000000-0000-4000-8000-000000000004';
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.album_viewer_grants) THEN
 RAISE EXCEPTION 'Changing private audience failed to revoke'; END IF;
END $$;
UPDATE public.media_albums SET visibility='PRIVATE_APPROVED' WHERE id='10000000-0000-4000-8000-000000000004';
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.album_viewer_grants) THEN
 RAISE EXCEPTION 'Old grants resurrected'; END IF;
END $$;
SELECT 'Album visibility migration, role grants and revocation: PASS' as result;
