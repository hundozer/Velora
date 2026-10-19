/** Opt-in disposable fixtures + existing member suite. Never loaded by app routes. */
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const base = process.env.INTIMO_E2E_BASE_URL;
const access = process.env.INTIMO_E2E_SHARE_URL;
assert.equal(process.env.VERCEL_ENV, 'preview', 'Preview build required');
assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname, 'fuczjjcwtxzzvoxilrme.supabase.co');
assert.equal(process.env.CLOUDFLARE_R2_BUCKET_NAME, 'intimo-staging-media');
assert.equal(process.env.CLOUDFLARE_R2_ACCOUNT_ID, 'e9dfc810ae6979dcf5599cedc3e3baf0');
assert.equal(base, 'https://velora-4oex8kgh9-hundozers-projects.vercel.app', 'Only the inspected isolated deployment is allowed');
assert.equal(new URL(access).origin, base, 'Access link must belong to the test deployment');
const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const r2 = new S3Client({ region: 'auto', endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED', credentials: { accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID, secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY } });
const run = randomUUID();
const password = randomBytes(24).toString('base64url');
const members = [];
const seededKeys = [];
const contexts = [];
let browser;
function ok(result, label) { if (result.error) throw new Error(`${label}: ${result.error.code ?? result.error.status ?? 'failed'}`); return result.data; }
async function status(response, expected, label) { assert.equal(response.status(), expected, `${label}: HTTP ${response.status()}`); }
async function onboarding(member, gender) {
  const context = await browser.newContext({ baseURL: base, viewport: { width: 390, height: 844 } });
  contexts.push(context);
  await context.request.get(access);
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  await page.goto('/login');
  await page.getByRole('button', { name: "Yes, I'm 18+" }).click();
  await page.getByLabel('Email', { exact: true }).fill(member.email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL('**/onboarding');
  await page.getByRole('button', { name: 'Just me', exact: true }).click();
  await page.getByRole('button', { name: gender, exact: true }).click();
  await page.getByRole('button', { name: 'Single', exact: true }).click();
  await page.getByLabel('Nickname').fill(`Acceptance ${member.label} ${run.slice(0, 8)}`);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Date of birth').fill('1990-01-01');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Dates', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  const created = page.waitForResponse(r => r.url().endsWith('/api/profile/me') && r.request().method() === 'POST');
  await page.getByRole('button', { name: /^Praha 2 / }).click();
  await status(await created, 201, 'UI onboarding profile creation');
  await page.getByRole('button', { name: 'Skip for now', exact: true }).click();
  await page.waitForURL(base + '/');
  member.context = context;
  member.page = page;
  const me = await context.request.get('/api/profile/me');
  await status(me, 200, 'New member profile');
  assert.equal((await me.json()).profile.id, member.id);
  await status(await context.request.put('/api/profile/me', { data: { profile: { headline: 'Synthetic acceptance profile, not a beta member' } } }), 200, 'Profile edit');
  console.log(`STAGING_ACCEPTANCE ${member.label} UI login/onboarding/profile-edit PASS`);
}
try {
  const binaryModule = await import(process.env.INTIMO_E2E_CHROMIUM_MODULE || '@sparticuz/chromium');
  const serverless = binaryModule.default?.default || binaryModule.default;
  const executablePath = await serverless.executablePath();
  const args = serverless.args.filter(arg => !/disable-web-security|disable-site-isolation|single-process/.test(arg));
  process.env.PLAYWRIGHT_CHROMIUM_PATH = executablePath;
  process.env.PLAYWRIGHT_CHROMIUM_ARGS = JSON.stringify(args);
  browser = await chromium.launch({ executablePath, args }); // Fail before creating fixtures if the browser cannot run.
  for (const label of ['A', 'B']) {
    const email = `intimo-e2e-${run}-${label.toLowerCase()}@example.invalid`;
    const data = ok(await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { intimo_acceptance_run: run } }), 'Create isolated Auth fixture');
    members.push({ id: data.user.id, email, label });
    console.log(`STAGING_ACCEPTANCE fixture ${label} ${data.user.id}`);
  }
  await onboarding(members[0], 'Woman');
  await onboarding(members[1], 'Man');
  const people = members[1].page;
  await people.goto('/people?view=everyone');
  await people.locator(`a[href="/profile/${members[0].id}"]`).first().click();
  const sheet=people.getByRole('dialog',{name:'Profile'});
  await sheet.waitFor({state:'visible'});
  await sheet.getByRole('button',{name:'Back to People'}).first().click();
  await people.waitForURL('**/people?view=everyone');
  assert.equal(await people.getByRole('dialog',{name:'Profile'}).count(),0);
  console.log('STAGING_ACCEPTANCE real People/profile sheet open/close PASS');
  const image = await sharp({ create: { width: 16, height: 12, channels: 3, background: 'blue' } }).withExif({ IFD0: { Make: 'Synthetic private camera' }, IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '50/1 5/1 0/1' } }).jpeg().toBuffer();
  const mediaId = randomUUID();
  const key = `acceptance-fixtures/${run}/private.jpg`;
  seededKeys.push(key);
  await r2.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: image, ContentType: 'image/jpeg' }));
  ok(await db.from('media_objects').insert({ id: mediaId, owner_id: members[0].id, object_key: key, media_type: 'IMAGE', mime_type: 'image/jpeg', byte_size: image.length, visibility: 'PRIVATE', content_rating: 'NON_EXPLICIT', upload_status: 'AVAILABLE', processing_status: 'READY', moderation_status: 'APPROVED' }), 'Seed approved private test photo');
  const delivered = await members[0].context.request.get(`/api/media/${mediaId}`);
  await status(delivered, 200, 'Metadata-sensitive owner delivery');
  assert.equal((await sharp(await delivered.body()).metadata()).exif, undefined, 'Delivered EXIF/GPS retained');
  console.log('STAGING_ACCEPTANCE actual private delivery strips EXIF/GPS PASS');
  const child = spawnSync(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', '--project=member-acceptance', '--trace=off', '--timeout=240000'], { stdio: 'inherit', timeout: 360000, env: { ...process.env, E2E_BASE_URL: base, E2E_ALLOWED_ORIGIN: base, E2E_VERCEL_SHARE_URL: access, E2E_A_EMAIL: members[0].email, E2E_B_EMAIL: members[1].email, E2E_A_PASSWORD: password, E2E_B_PASSWORD: password, E2E_A_PRIVATE_MEDIA_ID: mediaId } });
  assert.equal(child.status, 0, 'Existing two-member acceptance suite failed');
  const [a,b] = members;
  const planPayload={category:'DATE',title:'Synthetic eligibility plan',text:'Isolated acceptance fixture; no real meeting.',startsAt:new Date(Date.now()+60000).toISOString(),endsAt:new Date(Date.now()+3600000).toISOString()};
  await status(await a.context.request.post('/api/dating-ads',{data:{category:'DATE',title:'Missing times',text:'Invalid fixture plan without required times.'}}),400,'Plan requires timestamps');
  const positive=await a.context.request.post('/api/dating-ads',{data:planPayload});
  await status(positive,201,'Eligible Plan creation');
  const positiveId=(await positive.json()).plan.id;
  const negative=await a.context.request.post('/api/dating-ads',{data:{...planPayload,minAge:80,maxAge:99}});
  await status(negative,201,'Restricted Plan creation');
  const negativeId=(await negative.json()).plan.id;
  const catalogue=await b.context.request.get('/api/dating-ads');
  await status(catalogue,200,'Read Plan eligibility');
  const plans=(await catalogue.json()).plans;
  assert.equal(plans.find(p=>p.id===positiveId)?.canReply,true);
  assert.equal(plans.find(p=>p.id===negativeId)?.canReply,false);
  await status(await b.context.request.post('/api/messages',{data:{receiverId:a.id,datingAdId:positiveId,content:'Synthetic allowed Plan reply'}}),201,'Allowed Plan reply');
  await status(await b.context.request.post('/api/messages',{data:{receiverId:a.id,datingAdId:negativeId,content:'Synthetic denied Plan reply'}}),403,'Ineligible Plan reply');
  for(const planId of [positiveId,negativeId])await status(await a.context.request.delete(`/api/dating-ads/${planId}`),200,'Remove eligibility fixture Plan');
  console.log('STAGING_ACCEPTANCE required Plan times and positive/negative reply eligibility PASS');
  const direct = [];
  for (const member of members) {
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    ok(await client.auth.signInWithPassword({ email: member.email, password }), 'Real JWT sign-in');
    direct.push(client);
  }
  for (const c of direct) assert.ok(ok(await c.from('direct_messages').select('id'), 'Direct member message read').length > 0);
  for (const [blocker,target] of [[a,b],[b,a]]) {
    await status(await blocker.context.request.post('/api/blocks', { data: { targetProfileId: target.id } }), 201, 'Block fixture peer');
    for (const c of direct) assert.equal(ok(await c.from('direct_messages').select('id'), 'Direct JWT read after block').length, 0);
    await status(await blocker.context.request.delete(`/api/blocks?targetProfileId=${target.id}`), 200, 'Unblock fixture peer');
  }
  ok(await db.from('profiles').update({ account_status: 'DEACTIVATED' }).eq('id',a.id), 'Deactivate fixture for RLS probe');
  for (const c of direct) assert.equal(ok(await c.from('direct_messages').select('id'), 'Inactive JWT message read').length, 0);
  ok(await db.from('profiles').update({ account_status: 'ACTIVE' }).eq('id',a.id), 'Restore fixture before self deletion');
  console.log('STAGING_ACCEPTANCE real JWT REST reads denied both block directions and inactive participant PASS');
  await status(await b.context.request.post('/api/reports', { data: { contentType: 'PROFILE', reportedUserId: a.id, contentId: a.id, reason: 'OTHER', description: 'Synthetic acceptance test report; no real member involved.' } }),201,'Submit report');
  await status(await a.context.request.get('/api/privacy/export'),200,'Privacy export');
  await status(await a.context.request.post('/api/auth/delete-account', { data: { confirmation: 'DELETE' } }),200,'Self-service account deletion');
  await status(await a.context.request.get('/api/profile/me'),401,'Post-deletion application access');
  assert.ok(!(await a.context.request.get(`/api/media/${mediaId}`)).ok(),'Deleted owner retains media access');
  assert.ok(!(await b.context.request.get(`/api/media/${mediaId}`)).ok(),'Peer retains deleted-owner media access');
  assert.equal(ok(await direct[1].from('direct_messages').select('id'),'Post-deletion direct message read').length,0);
  console.log('STAGING_ACCEPTANCE report/export/self-deletion/access-denial PASS (scheduled retention still separate)');
} finally {
  const failures = [];
  async function attempt(label, fn) { try { await fn(); } catch { failures.push(label); } }
  for (const context of contexts) await attempt('close browser context',()=>context.close());
  await attempt('close browser',async()=>browser?.close());
  // Recover a remotely-created fixture after an ambiguous createUser response.
  await attempt('recover ambiguous Auth creations',async()=>{
    const users=ok(await db.auth.admin.listUsers({page:1,perPage:1000}),'Fixture recovery').users;
    for(const user of users) if(user.user_metadata?.intimo_acceptance_run===run && user.email?.startsWith(`intimo-e2e-${run}-`) && !members.some(m=>m.id===user.id)) members.push({id:user.id,email:user.email});
  });
  const ids = members.map(m=>m.id);
  const keys = new Set(seededKeys);
  if (ids.length) {
    await attempt('list owned media',async()=>{ const rows=ok(await db.from('media_objects').select('id,object_key,variants').in('owner_id',ids),'Fixture media lookup'); for(const row of rows){keys.add(row.object_key);for(const v of Object.values(row.variants??{}))if(v?.objectKey)keys.add(v.objectKey);const listed=await r2.send(new ListObjectsV2Command({Bucket:bucket,Prefix:`variants/${row.id}/`}));for(const item of listed.Contents??[])if(item.Key)keys.add(item.Key);} });
  }
  for (const key of keys) await attempt('delete fixture object',async()=>{
    await r2.send(new DeleteObjectCommand({Bucket:bucket,Key:key}));
    let absent=false;try{await r2.send(new HeadObjectCommand({Bucket:bucket,Key:key}));}catch(error){if(error?.$metadata?.httpStatusCode===404)absent=true;else throw error;}assert.ok(absent,'Fixture object remains');
  });
  if (ids.length) {
    // Remove synthetic dependent rows before FK-protected profiles. No real identity is selected.
    for (const [table,column] of [['content_participant_declarations','uploader_id'],['sensitive_access_events','actor_profile_id'],['admin_action_events','actor_profile_id'],['verification_reviews','profile_id'],['retention_execution_events','profile_id'],['retention_holds','profile_id'],['audit_events','actor_profile_id'],['direct_messages','sender_id'],['direct_messages','receiver_id'],['chat_messages','sender_id'],['moderation_events','actor_profile_id'],['moderation_appeals','appellant_id'],['moderation_cases','reporter_id'],['profiles','id']]) {
      await attempt(`delete ${table}.${column}`,async()=>ok(await db.from(table).delete().in(column,ids),'Fixture cleanup'));
    }
    for(const m of members) await attempt('delete Auth fixture',async()=>{const result=await db.auth.admin.deleteUser(m.id);if(result.error&&result.error.status!==404)throw result.error;});
    await attempt('verify no profiles',async()=>assert.equal(ok(await db.from('profiles').select('id').in('id',ids),'Cleanup verify').length,0));
    for(const m of members) await attempt('verify no Auth user',async()=>{const r=await db.auth.admin.getUserById(m.id);assert.ok(r.error&&r.error.status===404);});
    for(const [table,column] of [['direct_messages','sender_id'],['direct_messages','receiver_id'],['media_objects','owner_id'],['dating_ads','author_id']]) await attempt(`verify no ${table}`,async()=>{const result=await db.from(table).select('*',{count:'exact',head:true}).in(column,ids);ok(result,'Cleanup count');assert.equal(result.count,0);});
  }
  await attempt('verify fixture prefix empty',async()=>{const r=await r2.send(new ListObjectsV2Command({Bucket:bucket,Prefix:`acceptance-fixtures/${run}/`,MaxKeys:1}));assert.equal(r.Contents?.length??0,0);});
  r2.destroy();
  if(failures.length)throw new Error(`STAGING_ACCEPTANCE CLEANUP FAILED: ${failures.join(', ')}`);
  console.log('STAGING_ACCEPTANCE fixture Auth/profiles/media/messages/plans cleanup PASS');
}
