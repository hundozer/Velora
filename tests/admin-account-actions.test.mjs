import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const target = '12345678-1234-4123-8123-123456789012';
function setup({ fresh = true, denied = 0 } = {}) {
  const calls = [];
  const db = { from(table) { calls.push({ table }); const q = new Proxy({}, { get(_, key) {
    if (key === 'then') return resolve => resolve({ data: { id: target, account_status: 'BANNED' } });
    if (key === 'update' || key === 'insert') return value => { calls.push({ [key]: value }); return q; };
    return () => q;
  }}); return q; } };
  const mocks = {
    '@/lib/auth/adminAuthorization': { adminSessionFresh: () => fresh, hasAdminPermission: () => true },
    '@/lib/auth/adminApi': { requireAdminPermission: async () => denied ? { response: new Response(null, { status: denied }) } : { actor: { profileId: 'admin', role: 'SUPER_ADMIN' } }, requestSecurityMetadata: () => ({}) },
    '@/lib/supabase/server': { getServerSupabase: () => db },
  };
  const source = readFileSync(new URL('../src/app/api/admin/users/[id]/route.ts', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(name => name in mocks ? mocks[name] : require(name), module, module.exports);
  return { calls, apply: body => module.exports.PATCH({ json: async () => ({ reason: 'Reviewed account safety evidence', category: 'ACCOUNT_SAFETY', ...body }) }, { params: { id: target } }) };
}
test('stale sign-in returns actionable reauthentication code before database access', async () => {
  for (const action of ['BAN', 'SUSPEND', 'REACTIVATE']) {
    const x = setup({ fresh: false }); const response = await x.apply({ action, confirmation: `CONFIRM ${action}` });
    assert.equal(response.status, 409); assert.equal((await response.json()).code, 'RECENT_AUTH_REQUIRED'); assert.equal(x.calls.length, 0);
  }
});
test('missing or wrong typed confirmation has its own error and never writes', async () => {
  for (const confirmation of [undefined, '', 'CONFIRM SUSPEND']) {
    const x = setup(); const response = await x.apply({ action: 'BAN', confirmation });
    assert.equal(response.status, 409); assert.equal((await response.json()).code, 'CONFIRMATION_REQUIRED'); assert.equal(x.calls.length, 0);
  }
});
test('fresh confirmed action updates status and records the audit', async () => {
  const x = setup(); const response = await x.apply({ action: 'BAN', confirmation: 'CONFIRM BAN' });
  assert.equal(response.status, 200); assert.equal(x.calls.find(call => call.update).update.account_status, 'BANNED');
  assert.ok(x.calls.some(call => call.insert?.action === 'BAN'));
});
test('anonymous and unauthorized callers cannot reach account records', async () => {
  for (const denied of [401, 403]) { const x = setup({ denied }); assert.equal((await x.apply({ action: 'BAN', confirmation: 'CONFIRM BAN' })).status, denied); assert.equal(x.calls.length, 0); }
});
