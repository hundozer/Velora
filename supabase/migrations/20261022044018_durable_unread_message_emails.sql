-- Durable unread-message notifications. No historical-message backfill and no job scheduled here.
-- The CLI timestamp precedes some older future-dated migrations, so include the
-- identical email preference/state prerequisites used by 20261026_return_emails.
alter table public.profiles add column if not exists email_opt_out text[] not null default '{}';
create table if not exists public.email_send_state (
 profile_id uuid not null references public.profiles(id) on delete cascade,
 category text not null check (category in ('MESSAGE','INTEREST','PRIVATE_ACCESS','PLAN_REPLY')),
 last_sent_at timestamptz not null default now(), primary key(profile_id,category)
);
alter table public.email_send_state enable row level security;
revoke all on public.email_send_state from public, anon, authenticated;
grant select,insert,update,delete on public.email_send_state to service_role;

create table public.unread_email_outbox (
 id uuid primary key default gen_random_uuid(),
 profile_id uuid not null references public.profiles(id) on delete cascade,
 category text not null check(category in ('MESSAGE','PLAN_REPLY')),
 status text not null default 'PENDING' check(status in ('PENDING','PROCESSING','SENT','CANCELLED','FAILED')),
 created_at timestamptz not null default now(), due_at timestamptz not null default now()+interval '2 minutes',
 lease_id uuid, lease_until timestamptz, attempts integer not null default 0,
 first_attempt_at timestamptz, sent_at timestamptz, provider_id text,
 payload jsonb, last_error text
);
create unique index unread_email_one_pending on public.unread_email_outbox(profile_id,category)
 where status in ('PENDING','PROCESSING');
create index unread_email_due on public.unread_email_outbox(due_at) where status='PENDING';
alter table public.unread_email_outbox enable row level security;
revoke all on public.unread_email_outbox from public,anon,authenticated;
grant select,insert,update,delete on public.unread_email_outbox to service_role;

create function public.intimo_queue_unread_email() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.receiver_id is not null and new.sender_id is distinct from new.receiver_id then
  insert into public.unread_email_outbox(profile_id,category)
  values(new.receiver_id,case when new.plan_id is null then 'MESSAGE' else 'PLAN_REPLY' end)
  on conflict(profile_id,category) where status in ('PENDING','PROCESSING') do nothing;
 end if;
 return new;
end $$;
revoke all on function public.intimo_queue_unread_email() from public,anon,authenticated;
create trigger queue_unread_email after insert on public.direct_messages
 for each row execute function public.intimo_queue_unread_email();

-- Current eligibility, not a snapshot of sender content or recipient preferences.
create function public.intimo_has_unread_email(p_profile uuid,p_category text) returns boolean
language plpgsql stable security invoker set search_path='' as $$
begin
 return exists (
  select 1 from public.direct_messages m
  join public.profiles s on s.id=m.sender_id
  where m.receiver_id=p_profile and not coalesce(m.is_opened,false) and m.status='SENT'
   and s.account_status='ACTIVE' and not s.is_demo
   and (case when m.plan_id is null then 'MESSAGE' else 'PLAN_REPLY' end)=p_category
   and not exists(select 1 from public.user_blocks b
    where (b.blocker_id=m.sender_id and b.blocked_profile_id=m.receiver_id)
       or (b.blocker_id=m.receiver_id and b.blocked_profile_id=m.sender_id))
 );
end $$;
revoke all on function public.intimo_has_unread_email(uuid,text) from public,anon,authenticated;
grant execute on function public.intimo_has_unread_email(uuid,text) to service_role;

-- Row locks serialize claims, including concurrent cron invocations. Lease expiry
-- permits recovery after process termination; provider idempotency handles ambiguity.
create function public.intimo_claim_unread_emails(p_limit integer default 3)
returns setof public.unread_email_outbox language plpgsql security invoker set search_path='' as $$
declare q public.unread_email_outbox; p public.profiles; last_sent timestamptz;
begin
 for q in select * from public.unread_email_outbox
  where (status='PENDING' and due_at<=now()) or (status='PROCESSING' and lease_until<now())
  order by due_at for update skip locked limit least(greatest(p_limit,1),3)
 loop
  select * into p from public.profiles where id=q.profile_id;
  if not found or p.account_status<>'ACTIVE' or p.is_demo or p.email is null
    or 'ALL'=any(p.email_opt_out) or q.category=any(p.email_opt_out)
    or not public.intimo_has_unread_email(q.profile_id,q.category) then
   update public.unread_email_outbox set status='CANCELLED',payload=null,lease_id=null,lease_until=null where id=q.id;
   continue;
  end if;
  -- Never resend automatically outside Resend's 24-hour idempotency retention.
  if q.attempts>=8 or q.first_attempt_at<now()-interval '23 hours' then
   update public.unread_email_outbox set status='FAILED',payload=null,last_error='retry_window_exhausted',lease_id=null,lease_until=null where id=q.id;
   continue;
  end if;
  select last_sent_at into last_sent from public.email_send_state where profile_id=q.profile_id and category=q.category;
  if last_sent>now()-interval '3 hours' then
   update public.unread_email_outbox set status='PENDING',due_at=last_sent+interval '3 hours',lease_id=null,lease_until=null where id=q.id;
   continue;
  end if;
  if p.last_active_at>now()-interval '10 minutes' then
   update public.unread_email_outbox set status='PENDING',due_at=p.last_active_at+interval '10 minutes',lease_id=null,lease_until=null where id=q.id;
   continue;
  end if;
  update public.unread_email_outbox set status='PROCESSING',lease_id=gen_random_uuid(),lease_until=now()+interval '2 minutes',
    attempts=attempts+1,first_attempt_at=coalesce(first_attempt_at,now()) where id=q.id returning * into q;
  return next q;
 end loop;
end $$;
revoke all on function public.intimo_claim_unread_emails(integer) from public,anon,authenticated;
grant execute on function public.intimo_claim_unread_emails(integer) to service_role;

-- Persist the exact provider request before sending, and recheck eligibility at
-- dispatch. A changed address cancels a retry rather than mailing a stale address.
create function public.intimo_prepare_unread_email(p_id uuid,p_lease uuid,p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare q public.unread_email_outbox; p public.profiles;
begin
 select * into q from public.unread_email_outbox where id=p_id and lease_id=p_lease and status='PROCESSING' and lease_until>now() for update;
 if not found then return null; end if;
 select * into p from public.profiles where id=q.profile_id;
 if not found or p.account_status<>'ACTIVE' or p.is_demo or p.email is null
  or 'ALL'=any(p.email_opt_out) or q.category=any(p.email_opt_out)
  or not public.intimo_has_unread_email(q.profile_id,q.category)
  or coalesce(q.payload,p_payload)->>'to' is distinct from p.email then
  update public.unread_email_outbox set status='CANCELLED',payload=null,lease_id=null,lease_until=null where id=q.id;
  return null;
 end if;
 if p.last_active_at>now()-interval '10 minutes' then
  update public.unread_email_outbox set status='PENDING',due_at=p.last_active_at+interval '10 minutes',lease_id=null,lease_until=null where id=q.id;
  return null;
 end if;
 update public.unread_email_outbox set payload=coalesce(payload,p_payload) where id=q.id returning payload into p_payload;
 return p_payload;
end $$;
revoke all on function public.intimo_prepare_unread_email(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.intimo_prepare_unread_email(uuid,uuid,jsonb) to service_role;

create function public.intimo_finish_unread_email(p_id uuid,p_lease uuid,p_provider_id text default null,p_error text default null)
returns boolean language plpgsql security invoker set search_path='' as $$
declare q public.unread_email_outbox;
begin
 select * into q from public.unread_email_outbox where id=p_id and lease_id=p_lease and status='PROCESSING' for update;
 if not found then return false; end if;
 if p_provider_id is not null then
  update public.unread_email_outbox set status='SENT',payload=null,sent_at=now(),provider_id=p_provider_id,lease_id=null,lease_until=null,last_error=null where id=q.id;
  insert into public.email_send_state(profile_id,category,last_sent_at) values(q.profile_id,q.category,now())
   on conflict(profile_id,category) do update set last_sent_at=excluded.last_sent_at;
 else
  update public.unread_email_outbox set status='PENDING',due_at=now()+make_interval(secs=>least(3600,60*(2^least(q.attempts-1,6))::integer)),
   lease_id=null,lease_until=null,last_error=left(coalesce(p_error,'delivery_unavailable'),80) where id=q.id;
 end if;
 return true;
end $$;
revoke all on function public.intimo_finish_unread_email(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.intimo_finish_unread_email(uuid,uuid,text,text) to service_role;

-- Atomic opt-out union avoids concurrent links losing a category. Settings PUT
-- remains an intentional complete replacement by the authenticated member.
create function public.intimo_email_opt_out(p_profile uuid,p_category text) returns void
language sql security invoker set search_path='' as $$
 update public.profiles set email_opt_out=array(select distinct x from unnest(email_opt_out||p_category) x)
 where id=p_profile and p_category in ('ALL','MESSAGE','INTEREST','PRIVATE_ACCESS','PLAN_REPLY');
$$;
revoke all on function public.intimo_email_opt_out(uuid,text) from public,anon,authenticated;
grant execute on function public.intimo_email_opt_out(uuid,text) to service_role;

-- Free-plan scheduler. Configuration is explicit and separate from installation;
-- secrets live only in Vault, never in a cron command or source file.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create function public.intimo_tick_unread_worker() returns bigint
language plpgsql security definer set search_path='' as $$
declare cfg jsonb; headers jsonb;
begin
 select decrypted_secret::jsonb into cfg from vault.decrypted_secrets where name='intimo_unread_worker';
 if cfg is null or (cfg->>'expires_at')::timestamptz<now() then return null; end if;
 headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(cfg->>'bearer'));
 if cfg->>'protection' is not null then headers:=headers||jsonb_build_object('x-vercel-trusted-oidc-idp-token',cfg->>'protection'); end if;
 return net.http_post(url:=cfg->>'url',headers:=headers,body:='{}'::jsonb,timeout_milliseconds:=45000);
end $$;
revoke all on function public.intimo_tick_unread_worker() from public,anon,authenticated,service_role;

create function public.intimo_configure_unread_worker(p_url text,p_bearer text,p_protection text default null,p_expires_at timestamptz default null)
returns void language plpgsql security definer set search_path='' as $$
declare secret_id uuid; cfg text;
begin
 if p_url is null or p_bearer is null or p_url !~ '^https://(intimo\.live|velora-[a-z0-9]+-hundozers-projects\.vercel\.app)/api/internal/email/unread$'
  or length(p_bearer)<32 then raise exception 'Invalid worker configuration'; end if;
 if p_url not like 'https://intimo.live/%' and (p_expires_at is null or p_expires_at>now()+interval '30 minutes' or p_expires_at<=now()) then
  raise exception 'Preview configuration must expire within thirty minutes';
 end if;
 cfg:=jsonb_build_object('url',p_url,'bearer',p_bearer,'protection',p_protection,'expires_at',p_expires_at)::text;
 select id into secret_id from vault.secrets where name='intimo_unread_worker';
 if secret_id is null then perform vault.create_secret(cfg,'intimo_unread_worker');
 else perform vault.update_secret(secret_id,cfg); end if;
 perform cron.schedule('intimo-unread-email','* * * * *','select public.intimo_tick_unread_worker();');
end $$;
revoke all on function public.intimo_configure_unread_worker(text,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.intimo_configure_unread_worker(text,text,text,timestamptz) to service_role;

create function public.intimo_disable_unread_worker() returns void
language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from cron.job where jobname='intimo-unread-email') then perform cron.unschedule('intimo-unread-email'); end if;
 delete from vault.secrets where name='intimo_unread_worker';
end $$;
revoke all on function public.intimo_disable_unread_worker() from public,anon,authenticated;
grant execute on function public.intimo_disable_unread_worker() to service_role;
