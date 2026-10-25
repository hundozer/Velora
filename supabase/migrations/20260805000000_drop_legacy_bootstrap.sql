-- Removes the pre-canonical bootstrap schema (production migration 001_initial_schema,
-- applied 2026-09-22) so the canonical migrations that follow can create the real tables.
-- Acts only when the legacy shape is present (profiles without account_status), and
-- refuses to drop anything if a legacy table holds data. No-op on fresh or canonical databases.
do $$
declare t text; n bigint;
  legacy constant text[] := array['profiles','dating_ads','photo_albums','videos','chat_messages','connections','notifications','direct_messages'];
begin
  if to_regclass('public.profiles') is null
     or exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'account_status') then
    return;
  end if;
  foreach t in array legacy loop
    if to_regclass('public.' || t) is not null then
      execute format('select count(*) from public.%I', t) into n;
      if n > 0 then
        raise exception 'Legacy table public.% has % rows; migrate the data before dropping', t, n;
      end if;
    end if;
  end loop;
  drop table if exists public.direct_messages, public.notifications, public.connections, public.chat_messages,
    public.videos, public.photo_albums, public.dating_ads, public.profiles cascade;
end $$;
