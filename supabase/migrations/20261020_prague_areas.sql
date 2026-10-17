-- P1-03 Prague areas. Members choose an area, never a position.
-- Additive and idempotent: creates reference table public.areas, adds nullable
-- profiles.area_id, and a coarse area-to-area distance function. No data is
-- rewritten; existing city/country/location columns stay as they are.
-- Rollback: drop function public.area_distance_km(text, text);
--           alter table public.profiles drop column area_id; drop table public.areas;
-- Seed must match src/lib/areas.mjs (enforced by tests/prague-areas.test.mjs).

create table if not exists public.areas (
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  name text not null,
  label text not null,
  kind text not null check (kind in ('PRAGUE_DISTRICT', 'NEAR_PRAGUE', 'CZECHIA', 'ABROAD')),
  lat numeric(6,3),
  lng numeric(6,3),
  sort_order integer not null default 0,
  check ((lat is null) = (lng is null))
);

insert into public.areas (id, name, label, kind, lat, lng, sort_order) values
  ('praha-1', 'Praha 1', 'Old Town · Malá Strana', 'PRAGUE_DISTRICT', 50.087, 14.421, 10),
  ('praha-2', 'Praha 2', 'Vinohrady · Nové Město', 'PRAGUE_DISTRICT', 50.075, 14.432, 20),
  ('praha-3', 'Praha 3', 'Žižkov', 'PRAGUE_DISTRICT', 50.084, 14.462, 30),
  ('praha-4', 'Praha 4', 'Nusle · Michle · Podolí', 'PRAGUE_DISTRICT', 50.039, 14.452, 40),
  ('praha-5', 'Praha 5', 'Smíchov · Barrandov', 'PRAGUE_DISTRICT', 50.062, 14.386, 50),
  ('praha-6', 'Praha 6', 'Dejvice · Břevnov', 'PRAGUE_DISTRICT', 50.1, 14.36, 60),
  ('praha-7', 'Praha 7', 'Holešovice · Letná', 'PRAGUE_DISTRICT', 50.104, 14.433, 70),
  ('praha-8', 'Praha 8', 'Karlín · Libeň · Bohnice', 'PRAGUE_DISTRICT', 50.117, 14.462, 80),
  ('praha-9', 'Praha 9', 'Vysočany · Prosek', 'PRAGUE_DISTRICT', 50.111, 14.503, 90),
  ('praha-10', 'Praha 10', 'Vršovice · Strašnice', 'PRAGUE_DISTRICT', 50.067, 14.483, 100),
  ('praha-11', 'Praha 11', 'Chodov · Háje', 'PRAGUE_DISTRICT', 50.031, 14.505, 110),
  ('praha-12', 'Praha 12', 'Modřany · Kamýk', 'PRAGUE_DISTRICT', 50.005, 14.415, 120),
  ('praha-13', 'Praha 13', 'Stodůlky', 'PRAGUE_DISTRICT', 50.047, 14.33, 130),
  ('praha-14', 'Praha 14', 'Černý Most · Kyje', 'PRAGUE_DISTRICT', 50.104, 14.565, 140),
  ('praha-15', 'Praha 15', 'Hostivař', 'PRAGUE_DISTRICT', 50.049, 14.539, 150),
  ('praha-16', 'Praha 16', 'Radotín', 'PRAGUE_DISTRICT', 49.983, 14.356, 160),
  ('praha-17', 'Praha 17', 'Řepy', 'PRAGUE_DISTRICT', 50.069, 14.3, 170),
  ('praha-18', 'Praha 18', 'Letňany', 'PRAGUE_DISTRICT', 50.134, 14.515, 180),
  ('praha-19', 'Praha 19', 'Kbely', 'PRAGUE_DISTRICT', 50.133, 14.546, 190),
  ('praha-20', 'Praha 20', 'Horní Počernice', 'PRAGUE_DISTRICT', 50.112, 14.61, 200),
  ('praha-21', 'Praha 21', 'Újezd nad Lesy', 'PRAGUE_DISTRICT', 50.073, 14.663, 210),
  ('praha-22', 'Praha 22', 'Uhříněves', 'PRAGUE_DISTRICT', 50.036, 14.588, 220),
  ('kladno', 'Kladno', 'Near Prague', 'NEAR_PRAGUE', 50.147, 14.103, 230),
  ('beroun', 'Beroun', 'Near Prague', 'NEAR_PRAGUE', 49.964, 14.072, 240),
  ('melnik', 'Mělník', 'Near Prague', 'NEAR_PRAGUE', 50.351, 14.474, 250),
  ('brandys', 'Brandýs n. L.–St. Boleslav', 'Near Prague', 'NEAR_PRAGUE', 50.187, 14.663, 260),
  ('ricany', 'Říčany', 'Near Prague', 'NEAR_PRAGUE', 49.992, 14.654, 270),
  ('cernosice', 'Černošice', 'Near Prague', 'NEAR_PRAGUE', 49.96, 14.32, 280),
  ('roztoky', 'Roztoky', 'Near Prague', 'NEAR_PRAGUE', 50.158, 14.398, 290),
  ('kralupy', 'Kralupy n. Vltavou', 'Near Prague', 'NEAR_PRAGUE', 50.241, 14.311, 300),
  ('benesov', 'Benešov', 'Near Prague', 'NEAR_PRAGUE', 49.782, 14.687, 310),
  ('mlada-boleslav', 'Mladá Boleslav', 'Near Prague', 'NEAR_PRAGUE', 50.411, 14.903, 320),
  ('cz-other', 'Elsewhere in Czechia', 'Czechia', 'CZECHIA', null, null, 330),
  ('abroad', 'Outside Czechia', 'Abroad', 'ABROAD', null, null, 340)
on conflict (id) do update set
  name = excluded.name, label = excluded.label, kind = excluded.kind,
  lat = excluded.lat, lng = excluded.lng, sort_order = excluded.sort_order;

-- Reference data: readable by everyone, writable by nobody but the owner role.
alter table public.areas enable row level security;
revoke all on public.areas from anon, authenticated;
grant select on public.areas to anon, authenticated;
drop policy if exists areas_public_read on public.areas;
create policy areas_public_read on public.areas for select to anon, authenticated using (true);

alter table public.profiles add column if not exists area_id text references public.areas(id) on update cascade on delete set null;
create index if not exists profiles_area_id_idx on public.profiles (area_id);

-- Approximate distance between two area centroids in km; null when unknown.
create or replace function public.area_distance_km(from_area text, to_area text)
returns double precision
language sql
stable
set search_path = public
as $fn$
  select case when a.lat is null or b.lat is null then null else
    2 * 6371 * asin(sqrt(
      power(sin(radians((b.lat - a.lat)::double precision) / 2), 2) +
      cos(radians(a.lat::double precision)) * cos(radians(b.lat::double precision)) *
      power(sin(radians((b.lng - a.lng)::double precision) / 2), 2)
    )) end
  from public.areas a, public.areas b
  where a.id = from_area and b.id = to_area
$fn$;
revoke all on function public.area_distance_km(text, text) from public, anon, authenticated;
