import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const id = '12345678-1234-4123-8123-123456789012';
const source = readFileSync(new URL('../src/app/api/admin/users/[id]/deletion/route.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;

function setup({ denied = 0, fresh = true, self = false, assignment = false, legacy = false, lifecycle = 'ACTIVE', failure = '', existing = false } = {}) {
  const calls = []; let authDeletes = 0;
  const member = { id, auth_id: legacy ? 'auth0|preserved' : id, account_status: 'ACTIVE', account_lifecycle_status: lifecycle, deletion_requested_at: null, deactivated_at: null };
  let privacy = existing ? { id: 'existing-request', profile_id: id, request_type: 'DELETION', status: 'IN_PROGRESS' } : null;
  const db = {
    auth: { admin: { deleteUser: async target => { authDeletes++; assert.equal(target, id); calls.push({ authDelete: target }); return { error: failure === 'auth' ? { status: 503 } : failure === 'auth404' ? { status: 404 } : null }; } } },
    from(table) {
      let operation = 'select', values, options; const filters = [];
      const q = new Proxy({}, { get(_, key) {
        if (['insert', 'update', 'upsert'].includes(key)) return (input, inputOptions) => { operation = key; values = input; options = inputOptions; return q; };
        if (key === 'eq' || key === 'in') return (column, value) => { filters.push({ key, column, value }); return q; };
        if (key === 'then') return resolve => {
          calls.push({ table, operation, values, options, filters });
          const matches = row => row && filters.every(filter => filter.key === 'eq' ? row[filter.column] === filter.value : filter.value.includes(row[filter.column]));
          if (table === 'profiles') {
            if (operation === 'select') return resolve({ data: { ...member } });
            if ((failure === 'restrict' && values.account_status === 'DELETION_REQUESTED') || (failure === 'finalize' && values.account_status === 'DEACTIVATED')) return resolve({ error: {} });
            if (!matches(member)) return resolve({ data: null });
            Object.assign(member, values); return resolve({ data: { ...member } });
          }
          if (table === 'admin_assignments') return resolve({ data: assignment ? { id: 'assignment' } : null, error: failure === 'assignments' ? {} : null });
          if (table === 'admin_action_events') return resolve({ error: (failure === 'intent' && values.action === 'ADMIN_USER_DELETION_REQUESTED') || (failure === 'completionAudit' && values.action === 'ADMIN_USER_ACCESS_REMOVED') ? {} : null });
          if (table === 'privacy_requests') {
            if (failure === 'request') return resolve({ error: {} });
            if (operation === 'upsert' && !privacy) privacy = { ...values };
            return resolve({ data: matches(privacy) ? { ...privacy } : null });
          }
          throw Error(`Unexpected table ${table}`);
        };
        return () => q;
      }}); return q;
    },
  };
  const mocks = {
    '@/lib/auth/adminApi': { requireAdminPermission: async (_req, permission) => { assert.equal(permission, 'privacy:process'); return denied ? { response: new Response(null, { status: denied }) } : { actor: { profileId: self ? id : 'admin', role: 'SUPER_ADMIN' } }; }, requestSecurityMetadata: () => ({}) },
    '@/lib/auth/adminAuthorization': { adminSessionFresh: () => fresh },
    '@/lib/supabase/server': { getServerSupabase: () => db },
  };
  const module = { exports: {} }; new Function('require', 'module', 'exports', code)(name => name in mocks ? mocks[name] : require(name), module, module.exports);
  return { calls, member, get privacy() { return privacy; }, get authDeletes() { return authDeletes; }, apply: (body = {}) => module.exports.POST({ json: async () => ({ reason: 'Confirmed administrator deletion request', confirmation: `DELETE ${id}`, ...body }) }, { params: { id } }) };
}

test('deletion denies unauthorized, stale, self and incorrectly confirmed actions before data access', async () => {
  for (const [options, body, status] of [[{ denied: 401 }, {}, 401], [{ denied: 403 }, {}, 403], [{ fresh: false }, {}, 409], [{ self: true }, {}, 403], [{}, { confirmation: 'DELETE' }, 400], [{}, { reason: '' }, 400]]) {
    const x = setup(options); assert.equal((await x.apply(body)).status, status); assert.equal(x.calls.length, 0); assert.equal(x.authDeletes, 0);
  }
});
test('legacy profiles, administrator assignments and retention states cannot be erased here', async () => {
  for (const options of [{ legacy: true }, { assignment: true }, { lifecycle: 'DELETED' }, { lifecycle: 'ANONYMIZATION_IN_PROGRESS' }, { lifecycle: 'RETENTION_HOLD_IF_REQUIRED' }]) {
    const x = setup(options); assert.equal((await x.apply()).status, 409); assert.equal(x.authDeletes, 0); assert.ok(!x.calls.some(call => call.operation === 'update'));
  }
});
test('deletion records intent, disables access before Auth removal and leaves erasure pending', async () => {
  const x = setup(); const response = await x.apply(); const body = await response.json();
  assert.equal(response.status, 202); assert.equal(body.hardDeletionPending, true); assert.equal(body.lifecycleStatus, 'DEACTIVATED');
  assert.equal(x.member.account_status, 'DEACTIVATED'); assert.equal(x.member.discovery_disabled, true); assert.equal(x.member.messaging_disabled, true); assert.equal(x.member.media_uploads_disabled, true); assert.equal(x.member.public_profile_visibility, false);
  assert.equal(x.authDeletes, 1); assert.equal(x.privacy.status, 'IN_PROGRESS');
  assert.ok(x.calls.findIndex(call => call.values?.action === 'ADMIN_USER_DELETION_REQUESTED') < x.calls.findIndex(call => call.operation === 'update'));
  assert.ok(x.calls.findIndex(call => call.values?.account_status === 'DELETION_REQUESTED') < x.calls.findIndex(call => call.authDelete));
  const request = x.calls.find(call => call.operation === 'upsert'); assert.equal(request.values.id, id); assert.equal(request.options.ignoreDuplicates, true);
  assert.equal(x.calls.some(call => call.operation === 'delete'), false);
});
test('retry reuses the privacy request and original erasure eligibility instead of restarting retention', async () => {
  const x = setup({ existing: true }); x.member.account_lifecycle_status = 'DELETION_REQUESTED'; x.member.deletion_requested_at = '2026-10-01T12:00:00Z'; x.member.deactivated_at = '2026-10-02T12:00:00Z';
  const first = await (await x.apply()).json(); const second = await (await x.apply()).json();
  assert.equal(first.privacyRequestId, 'existing-request'); assert.equal(second.privacyRequestId, first.privacyRequestId); assert.equal(second.erasureEligibleAt, first.erasureEligibleAt);
  assert.equal(x.calls.filter(call => call.operation === 'upsert').length, 0);
});
test('lookup/audit/request failures stop before Auth removal and partial failures never claim completion', async () => {
  for (const failure of ['assignments', 'intent', 'request', 'restrict', 'auth', 'finalize', 'completionAudit']) {
    const x = setup({ failure }); const response = await x.apply(); assert.ok(response.status >= 500, failure);
    const body = await response.json(); assert.equal(body.hardDeletionPending, undefined); assert.ok(!x.calls.some(call => call.values?.status === 'COMPLETED'));
    if (['assignments', 'intent', 'request', 'restrict'].includes(failure)) assert.equal(x.authDeletes, 0);
    if (failure === 'auth') assert.equal(x.member.account_status, 'DELETION_REQUESTED');
  }
});
test('already removed Auth identity is resumable and never treated as a completed physical erasure', async () => {
  const x = setup({ failure: 'auth404' }); const response = await x.apply(); assert.equal(response.status, 202); assert.equal((await response.json()).hardDeletionPending, true);
});
