-- Admin-confirmed real gatherings only. All guest and address access is server mediated.
begin;
create table public.guest_nights (
 id uuid primary key default gen_random_uuid(),
 host_id uuid not null references public.profiles(id) on delete cascade,
 title text not null check(length(title) between 8 and 100),
 description text not null check(length(description) between 20 and 1000),
 area_id text references public.areas(id),
 starts_at timestamptz not null,
 ends_at timestamptz not null,
 capacity integer not null check(capacity between 2 and 12),
 exact_address text not null check(length(exact_address) between 8 and 240),
 status text not null default 'PUBLISHED' check(status in ('PUBLISHED','CANCELLED')),
 created_at timestamptz not null default now(),
 check(ends_at>starts_at)
);
create index guest_nights_live on public.guest_nights(starts_at) where status='PUBLISHED';
create table public.guest_requests (
 id uuid primary key default gen_random_uuid(),
 night_id uuid not null references public.guest_nights(id) on delete cascade,
 applicant_id uuid not null references public.profiles(id) on delete cascade,
 pitch text not null check(length(pitch) between 20 and 500),
 status text not null default 'REQUESTED' check(status in ('REQUESTED','ACCEPTED','DECLINED')),
 created_at timestamptz not null default now(),
 decided_at timestamptz,
 unique(night_id,applicant_id)
);
create index guest_requests_host on public.guest_requests(night_id,status);
create index guest_requests_applicant on public.guest_requests(applicant_id);
alter table public.guest_nights enable row level security;
alter table public.guest_requests enable row level security;
revoke all on public.guest_nights,public.guest_requests from public,anon,authenticated;
grant all on public.guest_nights,public.guest_requests to service_role;

create function public.intimo_guest_request(p_applicant uuid,p_night uuid,p_pitch text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare n public.guest_nights; result uuid;
begin
 select * into n from public.guest_nights where id=p_night for update;
 if not found or n.status<>'PUBLISHED' or n.starts_at<=now() or n.host_id=p_applicant
 or length(p_pitch) not between 20 and 500 then return null; end if;
 if not exists(select 1 from public.profiles p where p.id=p_applicant and p.account_status='ACTIVE'
 and p.age_verification_status in ('AGE_DECLARED','AGE_VERIFIED') and p.auth_id is not null)
 or not exists(select 1 from public.profiles p where p.id=n.host_id and p.account_status='ACTIVE'
 and p.age_verification_status in ('AGE_DECLARED','AGE_VERIFIED') and p.auth_id is not null and not p.discovery_disabled)
 or exists(select 1 from public.user_blocks b where
 (b.blocker_id=p_applicant and b.blocked_profile_id=n.host_id) or
 (b.blocker_id=n.host_id and b.blocked_profile_id=p_applicant))
 or (select count(*) from public.guest_requests where night_id=p_night)>=50 then return null; end if;
 insert into public.guest_requests(night_id,applicant_id,pitch) values(p_night,p_applicant,p_pitch)
 on conflict(night_id,applicant_id) do nothing returning id into result;
 return result;
end $$;
revoke all on function public.intimo_guest_request(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.intimo_guest_request(uuid,uuid,text) to service_role;

-- The row lock serialises host decisions so capacity cannot be exceeded.
create function public.intimo_guest_decide(p_host uuid,p_request uuid,p_accept boolean)
returns boolean language plpgsql security invoker set search_path='' as $$
declare n public.guest_nights; r public.guest_requests;
begin
 select g.* into n from public.guest_nights g join public.guest_requests q on q.night_id=g.id
 where q.id=p_request and g.host_id=p_host for update of g;
 if not found or n.status<>'PUBLISHED' or n.starts_at<=now() then return false; end if;
 select * into r from public.guest_requests where id=p_request and night_id=n.id for update;
 if r.status<>'REQUESTED' or r.applicant_id=p_host then return false; end if;
 if not exists(select 1 from public.profiles p where p.id=p_host and p.account_status='ACTIVE'
 and p.age_verification_status in ('AGE_DECLARED','AGE_VERIFIED') and p.auth_id is not null)
 or not exists(select 1 from public.profiles p where p.id=r.applicant_id and p.account_status='ACTIVE'
 and p.age_verification_status in ('AGE_DECLARED','AGE_VERIFIED') and p.auth_id is not null)
 or exists(select 1 from public.user_blocks b where
 (b.blocker_id=p_host and b.blocked_profile_id=r.applicant_id) or
 (b.blocker_id=r.applicant_id and b.blocked_profile_id=p_host)) then return false; end if;
 if p_accept and (select count(*) from public.guest_requests where night_id=n.id and status='ACCEPTED')>=n.capacity then return false; end if;
 update public.guest_requests set status=case when p_accept then 'ACCEPTED' else 'DECLINED' end,decided_at=now() where id=r.id;
 return true;
end $$;
revoke all on function public.intimo_guest_decide(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.intimo_guest_decide(uuid,uuid,boolean) to service_role;
commit;
