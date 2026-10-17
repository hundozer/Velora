-- ADR-002: Supabase Auth replaces Auth0. profiles.id is the auth.users.id and
-- profiles.auth_id (kept for the existing query paths) must equal it.
-- No FK to auth.users: deleting a login must not cascade away moderation history;
-- account deletion is handled by the privacy lifecycle instead.
begin;

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'audit_events' and column_name = 'actor_auth0_sub') then
    alter table public.audit_events rename column actor_auth0_sub to actor_user_id;
  end if;
end $$;

alter table public.profiles drop constraint if exists profiles_auth_id_matches_id;
alter table public.profiles add constraint profiles_auth_id_matches_id check (auth_id = id::text);

comment on column public.profiles.auth_id is 'Supabase auth.users.id as text; always equals id. Retained for existing query paths.';

commit;
