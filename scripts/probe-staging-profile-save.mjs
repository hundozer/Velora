/** Opt-in HTTP investigation; never imported by the application or default build. */
import assert from 'node:assert/strict';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { request } from '@playwright/test';

const base = 'https://velora-8nrl0463z-hundozers-projects.vercel.app';
assert.equal(process.env.VERCEL_ENV, 'preview');
assert.equal(process.env.INTIMO_PROFILE_PROBE_BASE_URL, base, 'Inspected Preview required');
assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname, 'fuczjjcwtxzzvoxilrme.supabase.co');
const access = process.env.INTIMO_PROFILE_PROBE_SHARE_URL;
assert.equal(new URL(access).origin, base);
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const run = randomUUID();
const password = randomBytes(30).toString('base64url');
const members = [];
const clients = [];
const samples = [];
let baseline;
function data(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.code || result.error.status || 'failed'}`);
  return result.data;
}
async function preservedRows() {
  const rows = {};
  for (const table of ['profiles', 'media_objects']) {
    const found = data(await db.from(table).select('*').order('id'), `Baseline ${table}`);
    rows[table] = createHash('sha256').update(JSON.stringify(found)).digest('hex');
  }
  return rows;
}
async function call(client, label, method, path, body, expected = 200) {
  const started = performance.now();
  let response;
  try {
    response = await client.fetch(path, { method, data: body, maxRedirects: 0, timeout: 90000 });
  } catch {
    console.log(`PROFILE_PROBE ${label} transport_failure elapsed_ms=${Math.round(performance.now() - started)}`);
    throw new Error(`${label}: transport failure; inspect persisted state before retry`);
  }
  const elapsed = Math.round(performance.now() - started);
  const record = { label, method, status: response.status(), elapsed_ms: elapsed };
  samples.push(record);
  console.log(`PROFILE_PROBE ${JSON.stringify(record)}`);
  assert.equal(response.status(), expected, `${label}: unexpected application response`);
  return response.json();
}
console.log(`PROFILE_PROBE run=${run} target_commit=f866f862cb8b724710900bd54b54af25227e8d92 app_matches_main=b0459433ca7fc705215928bc26da2e14e671409b`);
try {
  baseline = await preservedRows();
  const home = await request.newContext({ baseURL: base });
  clients.push(home);
  // Establish only an origin-scoped protection cookie. Never forward a share URL elsewhere.
  let next = access;
  for (let step = 0; step < 4; step++) {
    assert.equal(new URL(next).origin, base);
    const response = await home.get(next, { maxRedirects: 0 });
    if (response.status() === 200) break;
    assert.ok([301, 302, 303, 307, 308].includes(response.status()), 'Protected Preview access failed');
    const location = response.headers().location;
    assert.ok(location, 'Protection response missing location');
    next = new URL(location, base).href;
  }
  await call(home, 'public community', 'GET', '/api/public/community?limit=1');
  const protectionState = await home.storageState();
  for (const label of ['A', 'B']) {
    const email = `intimo-profile-probe-${run}-${label.toLowerCase()}@example.invalid`;
    const created = data(await db.auth.admin.createUser({ email, password, email_confirm: true,
      user_metadata: { intimo_profile_probe_run: run } }), 'Create synthetic identity');
    const member = { id: created.user.id, email, label };
    members.push(member);
    console.log(`PROFILE_PROBE fixture=${label} id=${member.id}`);
    const jar = new Map();
    const auth = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })),
        setAll: (changes) => changes.forEach(({ name, value }) => jar.set(name, value)) },
    });
    data(await auth.auth.signInWithPassword({ email, password }), 'Actual password login');
    const cookies = [...jar].map(([name, value]) => ({ name, value, domain: new URL(base).hostname,
      path: '/', expires: -1, httpOnly: false, secure: true, sameSite: 'Lax' }));
    member.client = await request.newContext({ baseURL: base,
      storageState: { cookies: [...protectionState.cookies, ...cookies], origins: [] } });
    clients.push(member.client);
    await call(member.client, `${label} age declaration`, 'POST', '/api/access/age-declaration', { adult: true });
    const profile = await call(member.client, `${label} onboarding`, 'POST', '/api/profile/me', {
      displayName: `Probe ${label} ${run.slice(0, 8)}`, dateOfBirth: '1990-01-01', profileType: 'SINGLE',
      gender: label === 'A' ? 'FEMALE' : 'MALE', relationshipStatus: 'SINGLE', areaId: 'praha-2',
      lookingFor: ['DATES'], messagePermission: 'EVERYONE',
    }, 201);
    assert.equal(profile.profile.id, member.id);
  }
  // Two independent real sessions, under each member's 20 updates/minute limit.
  for (let attempt = 1; attempt <= 8; attempt++) {
    for (const member of members) {
      const headline = `Synthetic profile-save probe ${member.label} ${attempt} ${run}`;
      const saved = await call(member.client, `${member.label} save ${attempt}`, 'PUT', '/api/profile/me', { profile: { headline } });
      assert.equal(saved.profile.headline, headline);
      const read = await call(member.client, `${member.label} read ${attempt}`, 'GET', '/api/profile/me');
      assert.equal(read.profile.headline, headline, 'Authenticated read must reflect saved change');
      const row = data(await db.from('profiles').select('headline').eq('id', member.id).single(), 'Persistence check');
      assert.equal(row.headline, headline, 'Database must reflect saved change');
    }
  }
  const saves = samples.filter(s => s.method === 'PUT').map(s => s.elapsed_ms).sort((a, b) => a - b);
  console.log(`PROFILE_PROBE saves=${saves.length} min_ms=${saves[0]} median_ms=${saves[Math.floor(saves.length / 2)]} max_ms=${saves.at(-1)} over_30s=${saves.filter(v => v > 30000).length} PASS`);
} catch (error) {
  // Never output original Playwright errors: their call logs can contain cookies.
  console.log(`PROFILE_PROBE FAILED type=${error?.name || 'Error'}`);
  process.exitCode = 1;
} finally {
  const failures = [];
  const attempt = async (label, action) => { try { await action(); } catch { failures.push(label); } };
  for (const client of clients) await attempt('dispose HTTP client', () => client.dispose());
  await attempt('recover ambiguous identity creation', async () => {
    const users = data(await db.auth.admin.listUsers({ page: 1, perPage: 1000 }), 'Recover fixtures').users;
    for (const user of users) if (user.user_metadata?.intimo_profile_probe_run === run &&
      user.email?.startsWith(`intimo-profile-probe-${run}-`) && !members.some(m => m.id === user.id)) members.push({ id: user.id });
  });
  const ids = members.map(m => m.id);
  if (ids.length) {
    for (const field of ['actor_profile_id', 'actor_user_id', 'resource_id']) await attempt(`remove fixture audit ${field}`, async () => {
      data(await db.from('audit_events').delete().in(field, ids), 'Audit cleanup');
    });
    await attempt('remove fixture rate limits', async () => {
      data(await db.from('rate_limit_buckets').delete().in('key', ids.flatMap(id => [`profile-create:${id}`, `profile-update:${id}`])), 'Rate cleanup');
    });
    await attempt('remove fixture profiles', async () => { data(await db.from('profiles').delete().in('id', ids), 'Profile cleanup'); });
    for (const member of members) await attempt('remove fixture identity', async () => { data(await db.auth.admin.deleteUser(member.id), 'Identity cleanup'); });
    for (const [table, field] of [['profiles', 'id'], ['audit_events', 'actor_user_id'], ['media_objects', 'owner_id'],
      ['direct_messages', 'sender_id'], ['direct_messages', 'receiver_id'], ['dating_ads', 'author_id']]) await attempt(`verify ${table}.${field}`, async () => {
      const result = await db.from(table).select('*', { head: true, count: 'exact' }).in(field, ids);
      data(result, 'Verify fixture absence'); assert.equal(result.count, 0);
    });
    for (const member of members) await attempt('verify no identity', async () => {
      const result = await db.auth.admin.getUserById(member.id); assert.equal(result.error?.status, 404);
    });
  }
  if (baseline) await attempt('preserve full legacy profile/media rows', async () => { assert.deepEqual(await preservedRows(), baseline); });
  console.log(`PROFILE_PROBE cleanup=${failures.length ? 'FAILED' : 'PASS'} fixtures=${ids.length} failures=${failures.join(',') || 'none'} no_uploads_or_messages_or_plans_created`);
  if (failures.length) process.exitCode = 1;
}
