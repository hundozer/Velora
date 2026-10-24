/** Explicit staging-only acceptance; no emails, tickets or uploaded files. */
import assert from 'node:assert/strict';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { request } from '@playwright/test';
const base = process.env.INTIMO_COMPANY_ACCEPT_BASE;
assert.equal(process.env.VERCEL_ENV, 'preview');
assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname, 'fuczjjcwtxzzvoxilrme.supabase.co');
assert.match(base || '', /^https:\/\/velora-[a-z0-9]+-hundozers-projects\.vercel\.app$/);
assert.ok(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.VERCEL_OIDC_TOKEN, 'Missing staging capabilities; no fixture created');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const protection = { 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN };
const run = randomUUID(), password = randomBytes(30).toString('base64url'), eventId = randomUUID();
const members = [], clients = [], planIds = [], messageIds = []; let baseline;
function result(response, label) { if (response.error) throw Error(`${label}:${response.error.code || response.error.status || 'failed'}`); return response.data; }
async function fingerprint() { const hashes = {}; for (const table of ['profiles', 'media_objects', 'scene_events']) hashes[table] = createHash('sha256').update(JSON.stringify(result(await db.from(table).select('*').order('id'), 'baseline'))).digest('hex'); return hashes; }
async function call(client, label, method, path, data, expected = 200) {
  const response = await client.fetch(path, { method, data, maxRedirects: 0, timeout: 60000 });
  console.log(`COMPANY_ACCEPT ${label} status=${response.status()}`); assert.equal(response.status(), expected, label); return response;
}
console.log(`COMPANY_ACCEPT run=${run}`);
try {
  baseline = await fingerprint();
  const anonymous = await request.newContext({ baseURL: base, extraHTTPHeaders: protection }); clients.push(anonymous);
  await call(anonymous, 'public Scene reachable', 'GET', '/api/scene');
  await call(anonymous, 'member invitations protected', 'GET', `/api/dating-ads?sceneEventId=${eventId}`, undefined, 401);
  await call(anonymous, 'anonymous publication protected', 'POST', '/api/dating-ads', {}, 401);
  const cookies = (await anonymous.storageState()).cookies;
  for (const label of ['A', 'B']) {
    const email = `intimo-company-${run}-${label.toLowerCase()}@example.invalid`;
    const created = result(await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { intimo_company_acceptance_run: run } }), 'create fixture');
    const member = { id: created.user.id, label }; members.push(member);
    const jar = new Map(); const auth = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: rows => rows.forEach(({ name, value }) => jar.set(name, value)) } });
    result(await auth.auth.signInWithPassword({ email, password }), 'fixture login');
    const authCookies = [...jar].map(([name, value]) => ({ name, value, domain: new URL(base).hostname, path: '/', expires: -1, httpOnly: false, secure: true, sameSite: 'Lax' }));
    member.client = await request.newContext({ baseURL: base, extraHTTPHeaders: protection, storageState: { cookies: [...cookies, ...authCookies], origins: [] } }); clients.push(member.client);
    await call(member.client, `${label} adult gate`, 'POST', '/api/access/age-declaration', { adult: true });
    await call(member.client, `${label} onboarding`, 'POST', '/api/profile/me', { displayName: `Company fixture ${label}`, dateOfBirth: '1990-01-01', profileType: 'SINGLE', gender: label === 'A' ? 'FEMALE' : 'MALE', relationshipStatus: 'SINGLE', areaId: 'praha-2', lookingFor: ['DATES'], messagePermission: 'EVERYONE' }, 201);
    await call(member.client, `${label} disables all email`, 'PUT', '/api/notifications/preferences', { optOut: ['ALL'] });
  }
  const [a, b] = members;
  const start = new Date(Date.now() + 7 * 86400000).toISOString(), end = new Date(Date.parse(start) + 3 * 3600000).toISOString();
  result(await db.from('scene_events').insert({ id: eventId, title: 'Synthetic staging company event', kind: 'MUNCH', starts_at: start, ends_at: end, organiser: 'Synthetic acceptance', area_id: 'praha-2', url: 'https://example.invalid/event', status: 'PENDING_REVIEW', submitted_by: a.id }), 'fixture event');
  const input = { sceneEventId: eventId, publishEventInvitation: true, title: 'Company for synthetic event', text: 'Meet first and respect each other’s boundaries.', category: 'PARTY', startsAt: start, endsAt: end, allowedReplyGenders: ['♀'] };
  await call(anonymous, 'hidden event not exposed', 'GET', `/api/scene?id=${eventId}`, undefined, 404);
  await call(a.client, 'hidden event cannot publish', 'POST', '/api/dating-ads', input, 409);
  result(await db.from('scene_events').update({ status: 'PUBLISHED' }).eq('id', eventId), 'publish fixture');
  const listing = await (await call(anonymous, 'published event detail', 'GET', `/api/scene?id=${eventId}`)).json();
  assert.equal(listing.events[0].companyWindow.startsAt, start);
  assert.ok(!JSON.stringify(listing).includes(a.id) && !JSON.stringify(listing).includes(b.id));
  assert.equal(result(await db.from('dating_ads').select('id').eq('scene_event_id', eventId), 'opening draft remains private').length, 0);
  await call(a.client, 'publication needs explicit consent', 'POST', '/api/dating-ads', { ...input, publishEventInvitation: false }, 400);
  await call(a.client, 'forged event time denied', 'POST', '/api/dating-ads', { ...input, startsAt: new Date(Date.parse(start) + 3600000).toISOString() }, 400);
  const { sceneEventId: _id, ...unlinked } = input;
  await call(a.client, 'ordinary future Plan still limited', 'POST', '/api/dating-ads', unlinked, 400);
  const restricted = await (await call(a.client, 'publish women-only company invitation', 'POST', '/api/dating-ads', input, 201)).json(); planIds.push(restricted.plan.id);
  let plans = await (await call(b.client, 'member event invitation list', 'GET', `/api/dating-ads?sceneEventId=${eventId}`)).json();
  assert.equal(plans.plans.length, 1); assert.equal(plans.plans[0].canReply, false); assert.equal(plans.plans[0].sceneEventId, eventId);
  await call(b.client, 'ineligible reply denied', 'POST', '/api/messages', { receiverId: a.id, datingAdId: restricted.plan.id, content: 'Ineligible synthetic reply' }, 403);
  const open = await (await call(a.client, 'publish eligible company invitation', 'POST', '/api/dating-ads', { ...input, allowedReplyGenders: ['♂'] }, 201)).json(); planIds.push(open.plan.id);
  const reply = await (await call(b.client, 'eligible private reply', 'POST', '/api/messages', { receiverId: a.id, datingAdId: open.plan.id, content: 'Synthetic acceptance reply about meeting at the event' }, 201)).json(); messageIds.push(reply.message.id);
  assert.equal(result(await db.from('direct_messages').select('plan_id').eq('id', reply.message.id).single(), 'reply linkage').plan_id, open.plan.id);
  await call(a.client, 'block peer', 'POST', '/api/blocks', { targetProfileId: b.id }, 201);
  plans = await (await call(b.client, 'blocked invitation list', 'GET', `/api/dating-ads?sceneEventId=${eventId}`)).json(); assert.equal(plans.plans.length, 0);
  await call(b.client, 'blocked reply denied', 'POST', '/api/messages', { receiverId: a.id, datingAdId: open.plan.id, content: 'Must not deliver after block' }, 403);
  await call(a.client, 'unblock fixture', 'DELETE', `/api/blocks?targetProfileId=${b.id}`);
  const changedStart = new Date(Date.parse(start) + 86400000).toISOString(), changedEnd = new Date(Date.parse(end) + 86400000).toISOString();
  result(await db.from('scene_events').update({ starts_at: changedStart, ends_at: changedEnd }).eq('id', eventId), 'reschedule fixture');
  assert.ok(result(await db.from('dating_ads').select('status').in('id', planIds), 'closed stale plans').every(plan => plan.status === 'closed'));
  await call(b.client, 'rescheduled invitation reply denied', 'POST', '/api/messages', { receiverId: a.id, datingAdId: open.plan.id, content: 'Must not deliver after event change' }, 409);
  const fresh = await (await call(a.client, 'publish reviewed rescheduled invitation', 'POST', '/api/dating-ads', { ...input, startsAt: changedStart, endsAt: changedEnd }, 201)).json(); planIds.push(fresh.plan.id);
  result(await db.from('scene_events').update({ status: 'REJECTED' }).eq('id', eventId), 'hide fixture');
  await call(anonymous, 'hidden event remains private', 'GET', `/api/scene?id=${eventId}`, undefined, 404);
  plans = await (await call(b.client, 'hidden event invitations suppressed', 'GET', `/api/dating-ads?sceneEventId=${eventId}`)).json(); assert.equal(plans.plans.length, 0);
  console.log('COMPANY_ACCEPT real_logins_event_draft_consent_linkage_eligibility_messaging_block_reschedule_hide=PASS');
} catch (error) {
  console.log(`COMPANY_ACCEPT FAILED check=${typeof error?.message === 'string' && !/https|cookie|token|Authorization/i.test(error.message) ? error.message.split('\n')[0].slice(0, 140) : 'details_redacted'}`); process.exitCode = 1;
} finally {
  const failures = []; async function attempt(label, action) { try { await action(); } catch { failures.push(label); } }
  await attempt('recover ambiguous identities', async () => { const users = result(await db.auth.admin.listUsers({ page: 1, perPage: 1000 }), 'recover identities').users; for (const user of users) if (user.user_metadata?.intimo_company_acceptance_run === run && !members.some(member => member.id === user.id)) members.push({ id: user.id }); });
  const ids = members.map(member => member.id);
  if (ids.length) {
    await attempt('messages', async () => result(await db.from('direct_messages').delete().or(`sender_id.in.(${ids.join(',')}),receiver_id.in.(${ids.join(',')})`), 'message cleanup'));
    await attempt('plans', async () => result(await db.from('dating_ads').delete().in('author_id', ids), 'plan cleanup'));
    await attempt('notifications', async () => result(await db.from('notifications').delete().in('user_id', ids), 'notice cleanup'));
    for (const column of ['actor_profile_id', 'actor_user_id', 'resource_id']) await attempt('audit ' + column, async () => result(await db.from('audit_events').delete().in(column, [...ids, ...planIds, ...messageIds]), 'audit cleanup'));
    await attempt('rate buckets', async () => result(await db.from('rate_limit_buckets').delete().in('key', ids.flatMap(id => ['profile-create:', 'profile-update:', 'plan-create:', 'plan-end:', 'message:', 'block:', 'notifications-preferences:'].map(prefix => prefix + id))), 'rate cleanup'));
  }
  await attempt('event', async () => result(await db.from('scene_events').delete().eq('id', eventId), 'event cleanup'));
  if (ids.length) {
    await attempt('profiles', async () => result(await db.from('profiles').delete().in('id', ids), 'profile cleanup'));
    for (const member of members) await attempt('Auth identity', async () => { const response = await db.auth.admin.deleteUser(member.id); if (response.error?.status !== 404) result(response, 'identity cleanup'); });
    for (const [table, column] of [['profiles', 'id'], ['dating_ads', 'author_id'], ['direct_messages', 'sender_id'], ['direct_messages', 'receiver_id'], ['notifications', 'user_id'], ['unread_email_outbox', 'profile_id'], ['email_send_state', 'profile_id'], ['audit_events', 'actor_user_id']]) await attempt('verify ' + table, async () => { const response = await db.from(table).select('*', { head: true, count: 'exact' }).in(column, ids); result(response, 'absence'); assert.equal(response.count, 0); });
    for (const member of members) await attempt('verify Auth absence', async () => assert.equal((await db.auth.admin.getUserById(member.id)).error?.status, 404));
  }
  if (baseline) await attempt('preserve existing data', async () => assert.deepEqual(await fingerprint(), baseline));
  for (const client of clients) await client.dispose();
  console.log(`COMPANY_ACCEPT cleanup=${failures.length ? 'FAILED' : 'PASS'} fixtures=${ids.length} failures=${failures.join(',') || 'none'} no_emails_tickets_uploads_created`);
  if (failures.length) process.exitCode = 1;
}
