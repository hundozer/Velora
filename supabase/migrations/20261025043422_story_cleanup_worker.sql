-- Expired/abandoned story media only. No profile/account erasure is scheduled.
create function public.intimo_story_cleanup_candidates()
returns table(id uuid,owner_id uuid,object_key text)
language sql stable security invoker set search_path='' as $$
 select m.id,m.owner_id,m.object_key from public.media_objects m
 where m.category='STORY' and m.created_at<now()-interval '24 hours'
 and not exists(select 1 from public.member_stories s where s.media_id=m.id and s.deleted_at is null and s.expires_at>now())
 and not exists(select 1 from public.retention_holds h where h.profile_id=m.owner_id and h.status='ACTIVE')
 order by m.created_at,m.id limit 50;
$$;
revoke all on function public.intimo_story_cleanup_candidates() from public,anon,authenticated;
grant execute on function public.intimo_story_cleanup_candidates() to service_role;

-- Supabase scheduler: existing pg_cron/pg_net/Vault from unread-email migration.
-- Installation creates no job; explicit configuration activates one exact worker.
create function public.intimo_tick_story_cleanup() returns bigint
language plpgsql security definer set search_path='' as $$
declare cfg jsonb; headers jsonb;
begin
 select decrypted_secret::jsonb into cfg from vault.decrypted_secrets where name='intimo_story_cleanup';
 if cfg is null or (cfg->>'expires_at')::timestamptz<now() then return null; end if;
 headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(cfg->>'bearer'));
 if cfg->>'protection' is not null then headers:=headers||jsonb_build_object('x-vercel-trusted-oidc-idp-token',cfg->>'protection'); end if;
 return net.http_post(url:=cfg->>'url',headers:=headers,body:='{}'::jsonb,timeout_milliseconds:=45000);
end $$;
revoke all on function public.intimo_tick_story_cleanup() from public,anon,authenticated,service_role;
create function public.intimo_configure_story_cleanup(p_url text,p_bearer text,p_run uuid,p_protection text default null,p_expires_at timestamptz default null)
returns void language plpgsql security definer set search_path='' as $$
declare cfg text; schedule text;
begin
 if p_url is null or p_bearer is null or p_run is null or
 p_url !~ '^https://(intimo\.live|velora-[a-z0-9]+-hundozers-projects\.vercel\.app)/api/internal/stories/cleanup$'
 or p_bearer !~ '^[0-9a-f]{64}$' then raise exception 'Invalid story cleanup configuration'; end if;
 if p_url not like 'https://intimo.live/%' and (p_expires_at is null or p_expires_at>now()+interval '30 minutes' or p_expires_at<=now()) then raise exception 'Preview worker must expire within thirty minutes'; end if;
 if exists(select 1 from vault.secrets where name='intimo_story_cleanup') or exists(select 1 from cron.job where jobname='intimo-story-cleanup') then raise exception 'Story cleanup is already configured'; end if;
 cfg:=jsonb_build_object('url',p_url,'bearer',p_bearer,'run',p_run,'protection',p_protection,'expires_at',p_expires_at)::text;
 perform vault.create_secret(cfg,'intimo_story_cleanup');
 schedule:=case when p_url like 'https://intimo.live/%' then '7 * * * *' else '* * * * *' end;
 perform cron.schedule('intimo-story-cleanup',schedule,'select public.intimo_tick_story_cleanup();');
end $$;
revoke all on function public.intimo_configure_story_cleanup(text,text,uuid,text,timestamptz) from public,anon,authenticated;
grant execute on function public.intimo_configure_story_cleanup(text,text,uuid,text,timestamptz) to service_role;
create function public.intimo_disable_story_cleanup(p_run uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare cfg jsonb;
begin
 select decrypted_secret::jsonb into cfg from vault.decrypted_secrets where name='intimo_story_cleanup';
 if cfg is null or cfg->>'run' is distinct from p_run::text then return false; end if;
 if exists(select 1 from cron.job where jobname='intimo-story-cleanup') then perform cron.unschedule('intimo-story-cleanup'); end if;
 delete from vault.secrets where name='intimo_story_cleanup';
 return true;
end $$;
revoke all on function public.intimo_disable_story_cleanup(uuid) from public,anon,authenticated;
grant execute on function public.intimo_disable_story_cleanup(uuid) to service_role;
