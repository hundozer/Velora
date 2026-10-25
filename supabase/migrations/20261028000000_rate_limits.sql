-- P1-13 Postgres rate limiting. One fixed-window counter per key, shared by all
-- serverless instances. intimo_rate_limit_hit() increments atomically and says
-- whether the call is allowed. Old windows are cleaned up opportunistically.
-- Additive and idempotent. Rollback: drop function public.intimo_rate_limit_hit(text, integer, integer);
--   drop table public.rate_limit_buckets;

create table if not exists public.rate_limit_buckets (
  key text primary key,
  window_start timestamptz not null,
  hits integer not null
);
create index if not exists rate_limit_buckets_window_idx on public.rate_limit_buckets (window_start);

alter table public.rate_limit_buckets enable row level security;
revoke all on public.rate_limit_buckets from anon, authenticated;

create or replace function public.intimo_rate_limit_hit(p_key text, p_limit integer, p_window_seconds integer)
returns table (allowed boolean, hits integer, reset_in_seconds integer)
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_now timestamptz := clock_timestamp();
  v_row public.rate_limit_buckets;
begin
  insert into public.rate_limit_buckets as b (key, window_start, hits)
  values (p_key, v_now, 1)
  on conflict (key) do update set
    window_start = case when b.window_start + make_interval(secs => p_window_seconds) <= v_now then v_now else b.window_start end,
    hits = case when b.window_start + make_interval(secs => p_window_seconds) <= v_now then 1 else b.hits + 1 end
  returning * into v_row;

  -- Occasional cleanup of windows that ended over a day ago.
  if random() < 0.01 then
    delete from public.rate_limit_buckets where window_start < v_now - interval '1 day';
  end if;

  return query select v_row.hits <= p_limit, v_row.hits,
    greatest(0, ceil(extract(epoch from (v_row.window_start + make_interval(secs => p_window_seconds) - v_now))))::integer;
end
$fn$;
revoke all on function public.intimo_rate_limit_hit(text, integer, integer) from public, anon, authenticated;
