-- Applied manually to production (bkdyjdbmtucqvgebqadp) on 2026-10-17 via SQL editor.
-- Production ran only the legacy bootstrap (001_initial_schema) with anon_* policies
-- granting public read/insert/update on profiles, direct_messages and other tables.
-- All tables were empty at the time (0 profiles, 0 messages, 0 auth.users).
-- The app reaches Postgres only through the server-side service role, so revoking
-- client-role table privileges closes the exposure without affecting the app.
-- The remaining anon_* policies are inert without grants and are dropped by the
-- Supabase Auth baseline migration (issue #8).
revoke all on table public.profiles, public.dating_ads, public.photo_albums, public.videos,
  public.chat_messages, public.connections, public.notifications, public.direct_messages
  from anon, authenticated;
