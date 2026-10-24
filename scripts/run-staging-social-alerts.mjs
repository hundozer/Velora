/** Explicit staging-only acceptance. Never in the normal build, test or CI. */
import assert from 'node:assert/strict';
import { randomUUID, randomBytes, createHmac, createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { request } from '@playwright/test';

const base = process.env.INTIMO_SOCIAL_ACCEPT_BASE;
assert.equal(process.env.VERCEL_ENV, 'preview');
assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname, 'fuczjjcwtxzzvoxilrme.supabase.co');
assert.match(base || '', /^https:\/\/velora-[a-z0-9]+-hundozers-projects\.vercel\.app$/);
assert.ok(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.RESEND_API_KEY && process.env.VERCEL_OIDC_TOKEN, 'Missing staging capabilities; no fixture created');
const recipient = 'registration@intimo.live'; // Owner-selected test inbox from prior acceptance.
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const protection = { 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN };
const workerToken = createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY).update('intimo-unread-worker-v1').digest('base64url');
const run = randomUUID(), password = randomBytes(30).toString('base64url');
const members = [], clients = []; let baseline, schedulerAttempted = false;
function result(response, label) { if (response.error) throw Error(`${label}:${response.error.code || response.error.status || 'failed'}`); return response.data; }
async function fingerprint() {
  const hashes = {};
  for (const table of ['profiles', 'media_objects']) hashes[table] = createHash('sha256').update(JSON.stringify(result(await db.from(table).select('*').order('id'), 'preservation baseline'))).digest('hex');
  return hashes;
}
async function call(client, label, method, path, data, expected = 200) {
  const response = await client.fetch(path, { method, data, maxRedirects: 0, timeout: 60000 });
  console.log(`SOCIAL_ACCEPT ${label} status=${response.status()}`);
  assert.equal(response.status(), expected, label); return response;
}
function unsubscribe(id, category) {
  const key = createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY).update('intimo-email-links-v1').digest();
  const token = createHmac('sha256', key).update(`${id}:${category}`).digest('base64url');
  return '/api/email/unsubscribe?' + new URLSearchParams({ u: id, c: category, t: token });
}
console.log(`SOCIAL_ACCEPT run=${run}`);
try {
  baseline = await fingerprint();
  const existing = result(await db.auth.admin.listUsers({ page: 1, perPage: 1000 }), 'identity preflight').users;
  assert.ok(!existing.some(user => user.email === recipient), 'Test inbox already used in staging; do not reuse an existing account');
  assert.equal(result(await db.from('unread_email_outbox').select('id').in('status', ['PENDING', 'PROCESSING']), 'idle queue preflight').length, 0);
  const worker = await request.newContext({ baseURL: base, extraHTTPHeaders: { ...protection, Authorization: `Bearer ${workerToken}` } }); clients.push(worker);
  const anonymous = await request.newContext({ baseURL: base, extraHTTPHeaders: protection }); clients.push(anonymous);
  await call(anonymous, 'unsigned worker denied', 'POST', '/api/internal/email/unread', {}, 404);
  await call(worker, 'worker ready before fixtures', 'POST', '/api/internal/email/unread', {});
  const cookies = (await anonymous.storageState()).cookies;
  for (const label of ['A', 'B']) {
    const email = label === 'B' ? recipient : `intimo-social-${run}@example.invalid`;
    const created = result(await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { intimo_social_acceptance_run: run } }), 'create fixture');
    const member = { id: created.user.id, email, label }; members.push(member);
    const jar = new Map();
    const auth = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: rows => rows.forEach(({ name, value }) => jar.set(name, value)) } });
    result(await auth.auth.signInWithPassword({ email, password }), 'fixture sign-in');
    const authCookies = [...jar].map(([name, value]) => ({ name, value, domain: new URL(base).hostname, path: '/', expires: -1, httpOnly: false, secure: true, sameSite: 'Lax' }));
    member.client = await request.newContext({ baseURL: base, extraHTTPHeaders: protection, storageState: { cookies: [...cookies, ...authCookies], origins: [] } }); clients.push(member.client);
    await call(member.client, `${label} adult gate`, 'POST', '/api/access/age-declaration', { adult: true });
    await call(member.client, `${label} onboarding`, 'POST', '/api/profile/me', { displayName: `Social fixture ${label}`, dateOfBirth: '1990-01-01', profileType: 'SINGLE', gender: label === 'A' ? 'FEMALE' : 'MALE', relationshipStatus: 'SINGLE', areaId: 'praha-2', lookingFor: ['DATES'], messagePermission: 'EVERYONE' }, 201);
  }
  const [a, b] = members;
  // Only the owner-selected inbox may receive real messages. A never emails.
  await call(a.client, 'A opts out of all mail', 'PUT', '/api/notifications/preferences', { optOut: ['ALL'] });
  await call(b.client, 'B enables return mail', 'PUT', '/api/notifications/preferences', { optOut: [] });
  const allJobs = () => db.from('unread_email_outbox').select('id,profile_id,category,status,provider_id,payload,last_error,attempts').in('profile_id', members.map(member => member.id));
  async function makeDue(category) {
    result(await db.from('profiles').update({ last_active_at: new Date(Date.now() - 86400000).toISOString() }).eq('id', b.id), 'make fixture away');
    let query = db.from('unread_email_outbox').update({ due_at: new Date(Date.now() - 60000).toISOString() }).in('profile_id', [a.id, b.id]).eq('status', 'PENDING');
    if (category) query = query.eq('category', category);
    result(await query, 'make fixture jobs due');
  }
  const dispatch = async label => (await call(worker, label, 'POST', '/api/internal/email/unread', {})).json();
  const interest = (member, peer, label) => call(member.client, label, 'POST', '/api/interests', { targetProfileId: peer.id }, 201);
  const decide = (decision, label) => call(a.client, label, 'PATCH', '/api/private-access', { viewerId: b.id, decision });

  await interest(a, b, 'one-sided interest'); await interest(a, b, 'repeat interest');
  assert.equal(result(await allJobs(), 'one-sided queue').length, 0);
  await call(a.client, 'clear one-sided signal before race', 'DELETE', `/api/interests?targetProfileId=${b.id}`);
  await Promise.all([interest(a, b, 'concurrent interest A'), interest(b, a, 'concurrent interest B')]);
  assert.equal(result(await allJobs(), 'mutual queue').filter(job => job.category === 'INTEREST').length, 2);
  await makeDue('INTEREST');
  schedulerAttempted = true;
  result(await db.rpc('intimo_configure_unread_worker', { p_url: base + '/api/internal/email/unread', p_bearer: workerToken, p_protection: process.env.VERCEL_OIDC_TOKEN, p_expires_at: new Date(Date.now() + 15 * 60000).toISOString() }), 'temporary scheduler');
  let accepted;
  for (let attempt = 0; attempt < 32; attempt++) {
    accepted = result(await allJobs(), 'scheduled result').find(job => job.profile_id === b.id && job.category === 'INTEREST' && job.status === 'SENT');
    if (accepted) break;
    await new Promise(resolve => setTimeout(resolve, 4000));
  }
  assert.ok(accepted?.provider_id, 'Scheduled mutual alert not accepted within 128 seconds');
  console.log(`SOCIAL_ACCEPT mutual_scheduler_provider=PASS provider_id=${accepted.provider_id}`);
  result(await db.rpc('intimo_disable_unread_worker'), 'disable scheduler'); schedulerAttempted = false;
  const repeats = await Promise.all([dispatch('repeat worker A'), dispatch('repeat worker B')]);
  for (const summary of repeats) assert.equal(summary.accepted, 0);

  await call(a.client, 'request B private photos', 'POST', '/api/private-access', { ownerId: b.id }, 201);
  await call(a.client, 'duplicate private request denied', 'POST', '/api/private-access', { ownerId: b.id }, 409);
  await makeDue('PRIVATE_ACCESS'); assert.equal((await dispatch('private request delivery')).accepted, 1);
  await call(b.client, 'request A private photos', 'POST', '/api/private-access', { ownerId: a.id }, 201);
  const approved = await (await decide('GRANT_ONCE', 'approve B access')).json();
  const repeated = await (await decide('GRANT_ONCE', 'repeat approval')).json(); assert.equal(repeated.expiresAt, approved.expiresAt);
  const notices = await (await call(b.client, 'read actual in-app notices', 'GET', '/api/notifications')).json();
  assert.equal(notices.notifications.filter(notice => notice.type === 'PRIVATE_ACCESS_GRANTED').length, 1);
  assert.ok(notices.notifications.some(notice => notice.type === 'PRIVATE_ACCESS_REQUEST' && notice.targetLink === '/me/private-photos'));
  assert.ok(notices.notifications.some(notice => notice.type === 'PRIVATE_ACCESS_GRANTED' && notice.targetLink === `/profile/${a.id}`));
  await makeDue('PRIVATE_ACCESS'); assert.equal((await dispatch('three-hour throttle')).accepted, 0);
  result(await db.from('email_send_state').update({ last_sent_at: new Date(Date.now() - 3 * 3600000 - 60000).toISOString() }).eq('profile_id', b.id).eq('category', 'PRIVATE_ACCESS'), 'advance only fixture throttle');
  await makeDue('PRIVATE_ACCESS'); assert.equal((await dispatch('private approval delivery')).accepted, 1);

  // Read state, revocation and both signed opt-outs suppress future deliveries.
  await call(a.client, 'withdraw interest', 'DELETE', `/api/interests?targetProfileId=${b.id}`);
  await interest(a, b, 'fresh mutual notice');
  await call(b.client, 'mark notices read', 'PATCH', '/api/notifications', { all: true });
  await makeDue('INTEREST'); assert.equal((await dispatch('read notice suppression')).accepted, 0);
  await decide('REVOKE', 'revoke old grant'); await decide('GRANT', 'new grant'); await decide('REVOKE', 'revoke before delivery');
  await makeDue('PRIVATE_ACCESS'); assert.equal((await dispatch('revoked approval suppression')).accepted, 0);
  for (const category of ['INTEREST', 'PRIVATE_ACCESS']) {
    await call(anonymous, `${category} unsubscribe GET`, 'GET', unsubscribe(b.id, category));
    const before = result(await db.from('profiles').select('email_opt_out').eq('id', b.id).single(), 'GET opt-out check'); assert.ok(!before.email_opt_out.includes(category));
    await call(anonymous, `${category} unsubscribe POST`, 'POST', unsubscribe(b.id, category), {});
  }
  await call(a.client, 'withdraw before opted-out match', 'DELETE', `/api/interests?targetProfileId=${b.id}`); await interest(a, b, 'opted-out mutual event');
  await decide('GRANT', 'opted-out approval'); await makeDue(); assert.equal((await dispatch('category opt-outs suppress both')).accepted, 0);
  await call(b.client, 'reset preferences', 'PUT', '/api/notifications/preferences', { optOut: [] });
  await call(anonymous, 'global unsubscribe', 'POST', unsubscribe(b.id, 'ALL'), {});
  await decide('REVOKE', 'revoke before global test'); await decide('GRANT', 'globally opted-out approval');
  await makeDue(); assert.equal((await dispatch('global opt-out suppression')).accepted, 0);
  const sent = result(await allJobs(), 'delivery summary').filter(job => job.status === 'SENT');
  assert.equal(sent.length, 3); assert.ok(sent.every(job => job.profile_id === b.id && job.provider_id && job.payload === null));
  assert.equal(result(await db.from('return_email_events').select('job_id').in('job_id', sent.map(job => job.id)), 'reference cleanup').length, 0);
  console.log('SOCIAL_ACCEPT real_logins_mutual_request_approval_queue_cron_provider_read_revocation_throttle_unsubscribe=PASS accepted=3 inbox_delivery=UNCONFIRMED');
} catch (error) {
  console.log(`SOCIAL_ACCEPT FAILED check=${typeof error?.message === 'string' && !/https|cookie|token|Authorization/i.test(error.message) ? error.message.split('\n')[0].slice(0, 140) : 'details_redacted'}`);
  process.exitCode = 1;
} finally {
  const failures = []; async function attempt(label, action) { try { await action(); } catch { failures.push(label); } }
  if (schedulerAttempted) await attempt('disable scheduler', async () => result(await db.rpc('intimo_disable_unread_worker'), 'disable scheduler'));
  await attempt('recover ambiguous identity creation', async () => {
    const users = result(await db.auth.admin.listUsers({ page: 1, perPage: 1000 }), 'recover identities').users;
    for (const user of users) if (user.user_metadata?.intimo_social_acceptance_run === run && !members.some(member => member.id === user.id)) members.push({ id: user.id });
  });
  const ids = members.map(member => member.id);
  if (ids.length) {
    await attempt('notifications', async () => result(await db.from('notifications').delete().in('user_id', ids), 'notification cleanup'));
    for (const column of ['actor_profile_id', 'actor_user_id', 'resource_id']) await attempt('audit ' + column, async () => result(await db.from('audit_events').delete().in(column, ids), 'audit cleanup'));
    await attempt('rate buckets', async () => result(await db.from('rate_limit_buckets').delete().in('key', ids.flatMap(id => ['profile-create:', 'profile-update:', 'interest:', 'private-access-request:', 'notifications-preferences:', 'notifications-update:', 'notifications:', 'boundaries:'].map(prefix => prefix + id))), 'rate cleanup'));
    await attempt('profiles', async () => result(await db.from('profiles').delete().in('id', ids), 'profile cleanup'));
    for (const member of members) await attempt('identity', async () => { const response = await db.auth.admin.deleteUser(member.id); if (response.error?.status !== 404) result(response, 'identity cleanup'); });
    for (const [table, column] of [['profiles', 'id'], ['interests', 'from_id'], ['interests', 'to_id'], ['album_access_grants', 'owner_id'], ['album_access_grants', 'viewer_id'], ['notifications', 'user_id'], ['unread_email_outbox', 'profile_id'], ['email_send_state', 'profile_id'], ['return_email_events', 'peer_id'], ['audit_events', 'actor_user_id']]) await attempt('verify ' + table, async () => { const response = await db.from(table).select('*', { head: true, count: 'exact' }).in(column, ids); result(response, 'absence check'); assert.equal(response.count, 0); });
    for (const member of members) await attempt('verify Auth absence', async () => assert.equal((await db.auth.admin.getUserById(member.id)).error?.status, 404));
  }
  if (baseline) await attempt('legacy profile/media preservation', async () => assert.deepEqual(await fingerprint(), baseline));
  for (const client of clients) await client.dispose();
  console.log(`SOCIAL_ACCEPT cleanup=${failures.length ? 'FAILED' : 'PASS'} fixtures=${ids.length} failures=${failures.join(',') || 'none'} no_messages_plans_uploads_created`);
  if (failures.length) process.exitCode = 1;
}
