import test from 'node:test';
import assert from 'node:assert/strict';
import { sceneCompanyWindow, scenePlanCurrent } from '../src/lib/sceneCompany.mjs';
import { validatePlanInput } from '../src/lib/plans.mjs';
import { glanceTime } from '../src/lib/tonight.mjs';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const now = new Date('2026-10-24T20:00:00Z');
const event = { status: 'PUBLISHED', starts_at: '2026-11-06T21:00:00Z', ends_at: '2026-11-07T04:00:00Z' };
const window = sceneCompanyWindow(event, now);
test('published event times support advance invitations without changing ordinary Plan limits', () => {
  const input = { category: 'PARTY', title: 'Go together', text: 'Meet first and see whether we get along.', ...window };
  assert.ok(validatePlanInput(input, now).error);
  assert.ok(validatePlanInput(input, now, window).plan);
  assert.ok(validatePlanInput({ ...input, startsAt: '2026-11-06T22:00:00Z' }, now, window).error);
  assert.ok(validatePlanInput({ ...input, sceneEventId: 'forged' }, now).error);
  assert.equal(glanceTime({ startsAt: event.starts_at }, now), '6 Nov 22:00');
});
test('event windows enforce future, 90 days, minimum duration, 12-hour cap and valid dates', () => {
  assert.equal(sceneCompanyWindow({ starts_at: 'bad' }, now), null);
  assert.equal(sceneCompanyWindow({ starts_at: now.toISOString() }, now), null);
  assert.equal(sceneCompanyWindow({ starts_at: '2027-03-01T20:00:00Z' }, now), null);
  assert.equal(sceneCompanyWindow({ ...event, ends_at: '2026-11-06T21:15:00Z' }, now), null);
  assert.equal(sceneCompanyWindow({ ...event, ends_at: '2026-11-10T21:00:00Z' }, now).endsAt, '2026-11-07T09:00:00.000Z');
  assert.equal(sceneCompanyWindow({ starts_at: event.starts_at }, now).endsAt, '2026-11-07T00:00:00.000Z');
});
test('rescheduled, hidden, ended and stale event links are unavailable', () => {
  const plan = { starts_at: window.startsAt, expires_at: window.endsAt };
  assert.equal(scenePlanCurrent(plan, event, now), true);
  for (const changed of [null, { ...event, status: 'REJECTED' }, { ...event, starts_at: '2026-11-06T22:00:00Z' }, { ...event, ends_at: '2026-11-07T03:00:00Z' }]) assert.equal(scenePlanCurrent(plan, changed, now), false);
  assert.equal(scenePlanCurrent(plan, event, new Date('2026-11-08')), false);
});

const id = '78100200-0000-4000-8000-000000000001';
function api({ published = true, unavailable = false } = {}) {
  const calls = [];
  const db = { from(table) { let operation = 'select', values; const q = new Proxy({}, { get(_, key) {
    if (key === 'insert') return input => { values = input; operation = 'insert'; calls.push({ table, values }); return q; };
    if (key === 'then') return resolve => {
      if (table === 'scene_events') return resolve({ data: published ? { id, status: 'PUBLISHED', starts_at: new Date(Date.now() + 7 * 86400000).toISOString(), ends_at: null, area_id: 'praha-2' } : null, error: unavailable ? {} : null });
      if (table === 'profiles') return resolve({ data: { display_name: 'Synthetic', area_id: 'praha-1' } });
      return resolve({ data: operation === 'insert' ? { id: 'plan', ...values, created_at: new Date().toISOString() } : [] });
    };
    return () => q;
  }}); return q; } };
  const source = readFileSync(new URL('../src/app/api/dating-ads/route.ts', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const mocks = {
    '@/lib/auth/serverActor': { resolveServerActor: async () => ({ status: 'authenticated', actor: { profileId: 'member', userId: 'member' } }), hasAdultAccess: () => true },
    '@/lib/supabase/server': { getServerSupabase: () => db }, '@/lib/security/rateLimiter': { checkRateLimit: async () => ({ allowed: true }) },
    '@/lib/auth/auditLogger': { auditLogger: { logEvent() {} } }, '@/lib/auth/durableAudit': { appendDurableAudit: async () => true },
    '@/lib/plans.mjs': require('../src/lib/plans.mjs'), '@/lib/planEligibility.mjs': require('../src/lib/planEligibility.mjs'), '@/lib/areas.mjs': require('../src/lib/areas.mjs'), '@/lib/sceneCompany.mjs': require('../src/lib/sceneCompany.mjs'),
  };
  const module = { exports: {} }; new Function('require', 'module', 'exports', code)(name => name in mocks ? mocks[name] : require(name), module, module.exports);
  return { calls, post: body => module.exports.POST({ headers: new Headers(), json: async () => ({ title: 'Go together', text: 'Meet first and see whether we get along.', category: 'PARTY', sceneEventId: id, ...body }) }) };
}
test('missing publication consent, hidden events and lookup failures never insert a plan', async () => {
  for (const [options, body, expected] of [[{}, {}, 400], [{ published: false }, { publishEventInvitation: true }, 409], [{ unavailable: true }, { publishEventInvitation: true }, 502]]) {
    const x = api(options); assert.equal((await x.post(body)).status, expected); assert.equal(x.calls.length, 0);
  }
});
