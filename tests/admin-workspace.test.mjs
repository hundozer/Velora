import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { normalizeWork, sortWork, photoReady, albumReady, waiting } from '../src/lib/admin/workspace.mjs';
const require = createRequire(import.meta.url);
function load(path, mocks) {
  const source = readFileSync(new URL('../' + path, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} }; new Function('require', 'module', 'exports', code)(name => name in mocks ? mocks[name] : require(name), module, module.exports); return module.exports;
}
test('urgent reports precede old content; completed records and private chat never enter the queue', () => {
  const report = normalizeWork('report', [{ id: 'urgent', status: 'OPEN', reason: 'NON_CONSENSUAL_INTIMATE_CONTENT', created_at: '2026-10-24' }, { id: 'closed', status: 'RESOLVED' }]);
  const photos = normalizeWork('photo', [{ id: 'old', created_at: '2026-01-01', moderation_status: 'PENDING_REVIEW', upload_status: 'AVAILABLE' }, { id: 'chat', category: 'MESSAGE', moderation_status: 'PENDING_REVIEW', upload_status: 'AVAILABLE' }, { id: 'removed', upload_status: 'REMOVED', moderation_status: 'PENDING_REVIEW' }]);
  assert.deepEqual(sortWork([...photos, ...report]).map(item => item.id), ['urgent', 'old']);
  assert.equal(normalizeWork('verification', [{ id: 'finished', status: 'VERIFIED' }, { id: 'waiting-member', status: 'RETRY_REQUESTED' }]).length, 0);
});
test('album readiness needs every available processed photo approved; empty albums cannot pass', () => {
  const photo = { upload_status: 'AVAILABLE', processing_status: 'READY', moderation_status: 'APPROVED' };
  assert.equal(albumReady([]), false); assert.equal(albumReady([photo]), true);
  for (const invalid of [{ ...photo, processing_status: 'FAILED' }, { ...photo, moderation_status: 'PENDING_REVIEW' }, { ...photo, upload_status: 'REMOVED' }]) assert.equal(albumReady([photo, invalid]), false);
  assert.equal(photoReady(null), false); assert.equal(waiting('bad-date'), 'Unknown age');
});
const id = '12345678-1234-4123-8123-123456789012';
test('owner responses expose requested changes without leaking internal moderation notes', async () => {
  for (const kind of ['albums', 'media']) {
    const rows = [{ id: 'internal', moderator_note: 'Internal investigation detail' }, { id: 'feedback', moderator_note: 'Changes requested: Please replace the cover' }];
    const filters = [];
    const db = { from(table) { const q = new Proxy({}, { get(_, key) {
      if (key === 'then') return resolve => resolve({ data: table === 'media_album_items' ? [] : rows });
      return (...args) => { if (key === 'eq') filters.push(args); return q; };
    }}); return q; } };
    const route = load(`src/app/api/${kind}/route.ts`, {
      '@/lib/auth/serverActor': { resolveServerActor: async () => ({ status: 'authenticated', actor: { profileId: 'owner' } }) },
      '@/lib/supabase/server': { getServerSupabase: () => db },
      '@/lib/security/rateLimiter': {},
      '@/lib/auth/durableAudit': {},
    });
    const response = await route.GET({ url: `https://example.test/api/${kind}` });
    const body = await response.json(); const returned = body[kind];
    assert.equal(returned[0].reviewFeedback, null);
    assert.equal(returned[1].reviewFeedback, 'Please replace the cover');
    assert.equal(JSON.stringify(body).includes('moderator_note'), false);
    assert.equal(JSON.stringify(body).includes('Internal investigation detail'), false);
    assert.ok(filters.some(([column, value]) => column === 'owner_id' && value === 'owner'));
  }
});
function mediaRoute({ deny = 0, auditError = null, noticeError = null } = {}) {
  const calls = []; let current = { id, owner_id: 'member', upload_status: 'AVAILABLE', processing_status: 'READY' };
  const db = { from(table) { let changed = false; const q = new Proxy({}, { get(_, key) {
    if (key === 'then') return resolve => resolve(table === 'admin_action_events' ? { error: auditError } : table === 'notifications' ? { error: noticeError } : { data: current });
    if (key === 'update') return value => { calls.push({ table, update: value }); current = { ...current, ...value }; changed = true; return q; };
    if (key === 'insert') return value => { calls.push({ table, insert: value }); return q; };
    return () => q;
  }}); return q; } };
  const notice = load('src/lib/admin/contentNotice.ts', {});
  const route = load('src/app/api/admin/media/route.ts', {
    '@/lib/auth/adminApi': { requireAdminPermission: async () => deny ? { response: new Response(null, { status: deny }) } : { actor: { profileId: 'admin', userId: 'admin', role: 'SUPER_ADMIN' } }, requestSecurityMetadata: () => ({}) },
    '@/lib/supabase/server': { getServerSupabase: () => { calls.push({ db: true }); return db; } }, '@/lib/admin/contentNotice': notice,
  });
  return { calls, route };
}
const request = extra => ({ json: async () => ({ id, decision: 'REJECTED', requestChanges: true, reason: 'Please remove identifying details', confirmation: 'CONFIRM REJECTED', notifyMember: true, ...extra }) });
test('content decision denies non-admin/MFA access before touching data', async () => {
  for (const deny of [401, 403]) { const x = mediaRoute({ deny }); assert.equal((await x.route.PATCH(request())).status, deny); assert.equal(x.calls.length, 0); }
});
test('request changes unpublishes content, records feedback and sends one opted-in in-app notice after audit', async () => {
  const x = mediaRoute(); const response = await x.route.PATCH(request()); assert.equal(response.status, 200);
  const update = x.calls.find(call => call.update).update;
  assert.equal(update.moderation_status, 'REJECTED'); assert.equal(update.published_at, null); assert.match(update.moderator_note, /^Changes requested:/);
  const tables = x.calls.filter(call => call.insert).map(call => call.table); assert.ok(tables.indexOf('admin_action_events') < tables.indexOf('notifications'));
  assert.equal(tables.filter(table => table === 'notifications').length, 1);
  assert.equal(x.calls.find(call => call.table === 'notifications').insert.user_id, 'member');
});
test('audit failure stops member notices, notice failure reports saved decision without asking for a repeat', async () => {
  let x = mediaRoute({ auditError: { code: 'unavailable' } }); assert.equal((await x.route.PATCH(request())).status, 502); assert.ok(!x.calls.some(call => call.table === 'notifications'));
  x = mediaRoute({ noticeError: { code: 'unavailable' } }); const response = await x.route.PATCH(request()); assert.equal(response.status, 200); assert.match((await response.json()).notificationWarning, /Do not repeat/);
  x = mediaRoute(); await x.route.PATCH(request({ notifyMember: false })); assert.ok(!x.calls.some(call => call.table === 'notifications'));
});
test('changes requested cannot be used to approve content or bypass destructive confirmation', async () => {
  for (const extra of [{ decision: 'APPROVED' }, { confirmation: '' }]) { const x = mediaRoute(); assert.equal((await x.route.PATCH(request(extra))).status, 400); assert.ok(!x.calls.some(call => call.update)); }
});
test('operational checks require settings permission and represent query failures as unavailable', async () => {
  for (const denied of [true, false]) {
    let reads = 0; const q = new Proxy({}, { get(_, key) { if (key === 'then') return resolve => resolve({ error: { code: 'missing_table' }, count: null }); return () => q; } });
    const route = load('src/app/api/admin/operations/route.ts', { '@/lib/auth/adminApi': { requireAdminPermission: async (_req, permission) => { assert.equal(permission, 'settings:view'); return denied ? { response: new Response(null, { status: 403 }) } : { actor: {} }; } }, '@/lib/supabase/server': { getServerSupabase: () => ({ from() { reads++; return q; } }) } });
    const response = await route.GET({}); assert.equal(response.status, denied ? 403 : 200);
    if (denied) assert.equal(reads, 0); else assert.ok((await response.json()).checks.every(check => check.count === null));
  }
});
