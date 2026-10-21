/** Opt-in staging-only acceptance; never runs in the default build or CI. */
import assert from 'node:assert/strict';
import {randomUUID,randomBytes,createHmac,createHash} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import {request} from '@playwright/test';
const base='https://velora-35etb5f50-hundozers-projects.vercel.app';
const recipient='registration@intimo.live'; // Explicitly selected by the owner for this test.
assert.equal(process.env.VERCEL_ENV,'preview');
assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,'fuczjjcwtxzzvoxilrme.supabase.co');
assert.ok(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.RESEND_API_KEY && process.env.VERCEL_OIDC_TOKEN,'Required staging capabilities unavailable; no fixture created');
const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const token=process.env.VERCEL_OIDC_TOKEN;
const protection={'x-vercel-trusted-oidc-idp-token':token};
const workerToken=createHmac('sha256',process.env.SUPABASE_SERVICE_ROLE_KEY).update('intimo-unread-worker-v1').digest('base64url');
const run=randomUUID(), password=randomBytes(30).toString('base64url');
const members=[],clients=[],messageIds=[];let baseline,configurationAttempted=false;
function result(r,label){if(r.error)throw new Error(label+':'+(r.error.code||r.error.status||'failed'));return r.data;}
async function hashes(){const h={};for(const table of ['profiles','media_objects'])h[table]=createHash('sha256').update(JSON.stringify(result(await db.from(table).select('*').order('id'),'baseline'))).digest('hex');return h;}
async function call(client,label,method,path,data,expected=200){let r;try{r=await client.fetch(path,{method,data,maxRedirects:0,timeout:60000});}catch{throw new Error(label+':transport');}console.log(`UNREAD_ACCEPT ${label} status=${r.status()}`);assert.equal(r.status(),expected,label);return r;}
function unsub(id,category){const key=createHmac('sha256',process.env.SUPABASE_SERVICE_ROLE_KEY).update('intimo-email-links-v1').digest();const signature=createHmac('sha256',key).update(`${id}:${category}`).digest('base64url');return '/api/email/unsubscribe?'+new URLSearchParams({u:id,c:category,t:signature});}
console.log(`UNREAD_ACCEPT run=${run} app_commit=e1a6ae047413305ad26541fdde996f7eb7e5cde1`);
try{
 baseline=await hashes();
 const users=result(await db.auth.admin.listUsers({page:1,perPage:1000}),'identity preflight').users;
 assert.ok(!users.some(u=>u.email===recipient),'Staging recipient already exists; do not reuse it');
 const admin=await request.newContext({baseURL:base,extraHTTPHeaders:{...protection,Authorization:'Bearer '+workerToken}});clients.push(admin);
 const anonymous=await request.newContext({baseURL:base,extraHTTPHeaders:protection});clients.push(anonymous);
 await call(anonymous,'worker rejects unsigned request','POST','/api/internal/email/unread',{},404);
 await call(admin,'worker available before fixtures','POST','/api/internal/email/unread',{});
 const cookies=(await anonymous.storageState()).cookies;
 for(const label of ['A','B']){
  const email=label==='B'?recipient:`intimo-unread-${run}@example.invalid`;
  const created=result(await db.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{intimo_unread_acceptance_run:run}}),'create fixture');
  const member={id:created.user.id,email,label};members.push(member);console.log(`UNREAD_ACCEPT fixture=${label} id=${member.id}`);
  const jar=new Map();const auth=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:rows=>rows.forEach(({name,value})=>jar.set(name,value))}});
  result(await auth.auth.signInWithPassword({email,password}),'real fixture login');
  const authCookies=[...jar].map(([name,value])=>({name,value,domain:new URL(base).hostname,path:'/',expires:-1,httpOnly:false,secure:true,sameSite:'Lax'}));
  member.client=await request.newContext({baseURL:base,extraHTTPHeaders:protection,storageState:{cookies:[...cookies,...authCookies],origins:[]}});clients.push(member.client);
  await call(member.client,`${label} adult declaration`,'POST','/api/access/age-declaration',{adult:true});
  await call(member.client,`${label} onboarding`,'POST','/api/profile/me',{displayName:`Unread fixture ${label}`,dateOfBirth:'1990-01-01',profileType:'SINGLE',gender:label==='A'?'FEMALE':'MALE',relationshipStatus:'SINGLE',areaId:'praha-2',lookingFor:['DATES'],messagePermission:'EVERYONE'},201);
 }
 const [a,b]=members;
 async function send(label){const r=await call(a.client,label,'POST','/api/messages',{receiverId:b.id,content:'Synthetic staging acceptance message '+run},201);const j=await r.json();messageIds.push(j.message.id);}
 await send('first actual message');await send('second actual message');
 let rows=result(await db.from('unread_email_outbox').select('id,status').eq('profile_id',b.id),'queue check');assert.equal(rows.length,1);assert.equal(rows[0].status,'PENDING');
 result(await db.from('profiles').update({last_active_at:new Date(Date.now()-86400000).toISOString()}).eq('id',b.id),'simulate recipient away');
 result(await db.from('unread_email_outbox').update({due_at:new Date(Date.now()-60000).toISOString()}).eq('id',rows[0].id),'make fixture due');
 // Bounded protected Preview scheduler test. Dedicated Vault config expires after
 // fifteen minutes and is removed in finally. It is never put into env settings.
 configurationAttempted=true;
 result(await db.rpc('intimo_configure_unread_worker',{p_url:base+'/api/internal/email/unread',p_bearer:workerToken,p_protection:token,p_expires_at:new Date(Date.now()+15*60000).toISOString()}),'configure staging cron');
 const started=Date.now();let accepted;
 while(Date.now()-started<130000){
  const row=result(await db.from('unread_email_outbox').select('status,provider_id,last_error,attempts,payload').eq('id',rows[0].id).single(),'observe scheduled delivery');
  if(row.status==='SENT'){accepted=row;break;}
  if(row.last_error)console.log(`UNREAD_ACCEPT worker_error=${row.last_error} attempts=${row.attempts}`);
  await new Promise(resolve=>setTimeout(resolve,4000));
 }
 assert.ok(accepted,'Scheduled worker did not accept the email within130seconds');assert.ok(accepted.provider_id);assert.equal(accepted.payload,null);
 console.log(`UNREAD_ACCEPT scheduler_provider_acceptance=PASS elapsed_ms=${Date.now()-started} provider_id=${accepted.provider_id}`);
 result(await db.rpc('intimo_disable_unread_worker'),'disable test cron');configurationAttempted=false;
 const repeats=await Promise.all([call(admin,'duplicate worker A','POST','/api/internal/email/unread',{}),call(admin,'duplicate worker B','POST','/api/internal/email/unread',{})]);
 for(const r of repeats)assert.equal((await r.json()).accepted,0);
 const provider=await fetch('https://api.resend.com/emails/'+encodeURIComponent(accepted.provider_id),{headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY},redirect:'error',signal:AbortSignal.timeout(15000)});
 if(provider.ok){const email=await provider.json();assert.equal(email.subject,'You have an update on Intimo');assert.ok(!email.html.includes(run));assert.ok(!email.html.includes('Unread fixture'));console.log(`UNREAD_ACCEPT provider_event=${['delivered','sent','delivery_delayed','bounced','complained'].includes(email.last_event)?email.last_event:'unconfirmed'} content_discreet=PASS`);}else console.log(`UNREAD_ACCEPT provider_receipt_read_unavailable=${provider.status} inbox_delivery_unconfirmed`);
 await call(anonymous,'unsubscribe GET confirms without mutating','GET',unsub(b.id,'MESSAGE'));
 assert.deepEqual(result(await db.from('profiles').select('email_opt_out').eq('id',b.id).single(),'GET preserves preference').email_opt_out,[]);
 await call(anonymous,'signed category unsubscribe','POST',unsub(b.id,'MESSAGE'),{});
 await send('message after category opt-out');
 result(await db.from('unread_email_outbox').update({due_at:new Date(Date.now()-60000).toISOString()}).eq('profile_id',b.id).eq('status','PENDING'),'make opted-out job due');
 assert.equal((await (await call(admin,'worker respects category opt-out','POST','/api/internal/email/unread',{})).json()).accepted,0);
 assert.equal(result(await db.from('unread_email_outbox').select('id').eq('profile_id',b.id).eq('status','CANCELLED'),'cancelled notification').length,1);
 await call(b.client,'reset category preferences','PUT','/api/notifications/preferences',{optOut:[]});
 await call(anonymous,'signed all-category unsubscribe','POST',unsub(b.id,'ALL'),{});
 await send('message after global opt-out');
 result(await db.from('unread_email_outbox').update({due_at:new Date(Date.now()-60000).toISOString()}).eq('profile_id',b.id).eq('status','PENDING'),'make global-opt-out job due');
 assert.equal((await (await call(admin,'worker respects global opt-out','POST','/api/internal/email/unread',{})).json()).accepted,0);
 console.log('UNREAD_ACCEPT real_messages_queue_scheduler_provider_duplicate_suppression_unsubscribe=PASS inbox_confirmation=OWNER_REQUIRED');
}catch(error){console.log(`UNREAD_ACCEPT FAILED type=${error?.name||'Error'} check=${typeof error?.message==='string'&&!/https|cookie|token|Authorization/i.test(error.message)?error.message.split('\n')[0].slice(0,140):'details_redacted'}`);process.exitCode=1;}
finally{
 const failures=[];async function attempt(label,fn){try{await fn();}catch{failures.push(label);}}
 if(configurationAttempted)await attempt('remove cron/vault',async()=>result(await db.rpc('intimo_disable_unread_worker'),'disable cron'));
 await attempt('recover ambiguous fixture creation',async()=>{const users=result(await db.auth.admin.listUsers({page:1,perPage:1000}),'recover fixtures').users;for(const u of users)if(u.user_metadata?.intimo_unread_acceptance_run===run&&!members.some(m=>m.id===u.id))members.push({id:u.id});});
 const ids=members.map(m=>m.id);
 if(ids.length){
  await attempt('remove messages',async()=>result(await db.from('direct_messages').delete().or(`sender_id.in.(${ids.join(',')}),receiver_id.in.(${ids.join(',')})`),'message cleanup'));
  await attempt('remove notifications',async()=>result(await db.from('notifications').delete().in('user_id',ids),'notification cleanup'));
  for(const field of ['actor_profile_id','actor_user_id','resource_id'])await attempt('remove audits '+field,async()=>result(await db.from('audit_events').delete().in(field,[...ids,...messageIds]),'audit cleanup'));
  await attempt('remove rate buckets',async()=>result(await db.from('rate_limit_buckets').delete().in('key',ids.flatMap(id=>['profile-create:','profile-update:','message:','notifications-preferences:'].map(prefix=>prefix+id))),'rate cleanup'));
  await attempt('remove profiles',async()=>result(await db.from('profiles').delete().in('id',ids),'profile cleanup'));
  for(const m of members)await attempt('remove identity',async()=>result(await db.auth.admin.deleteUser(m.id),'identity cleanup'));
  for(const [table,column]of [['profiles','id'],['direct_messages','sender_id'],['direct_messages','receiver_id'],['notifications','user_id'],['unread_email_outbox','profile_id'],['email_send_state','profile_id'],['audit_events','actor_user_id']])await attempt('verify '+table,async()=>{const r=await db.from(table).select('*',{head:true,count:'exact'}).in(column,ids);result(r,'absence');assert.equal(r.count,0);});
  for(const m of members)await attempt('verify identity absence',async()=>assert.equal((await db.auth.admin.getUserById(m.id)).error?.status,404));
 }
 if(baseline)await attempt('preserve legacy profiles/media',async()=>assert.deepEqual(await hashes(),baseline));
 for(const client of clients)await client.dispose();
 console.log(`UNREAD_ACCEPT cleanup=${failures.length?'FAILED':'PASS'} fixtures=${ids.length} failures=${failures.join(',')||'none'} no_plans_uploads_created`);
 if(failures.length)process.exitCode=1;
}
