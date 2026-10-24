import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const fixtureEnv = { SUPABASE_SERVICE_ROLE_KEY: 'isolated-test-key', VERCEL_ENV: 'preview', VERCEL_URL: 'velora-fixture-hundozers-projects.vercel.app', RESEND_API_KEY: 'isolated-provider-key' };
function load(path, mocks = {}) {
  const code = ts.transpileModule(readFileSync(new URL('../' + path, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'process', code)(name => name in mocks ? mocks[name] : require(name), module, module.exports, { env: fixtureEnv });
  return module.exports;
}
const email = load('src/lib/notifications/returnEmails.ts');
const id = '78100100-0000-4000-8000-000000000001';

test('social email templates stay on Preview and disclose no member names, photos or profile links', () => {
  for (const category of ['INTEREST', 'PRIVATE_ACCESS']) {
    const html = email.renderReturnEmail(category, id);
    assert.match(html, /https:\/\/velora-fixture-hundozers-projects.vercel.app/);
    assert.doesNotMatch(html, /https:\/\/intimo.live|\/profile\/|<img|object_key|avatar/);
    assert.match(html, /Stop these emails/); assert.match(html, /Stop all Intimo emails/);
    assert.match(html, category === 'INTEREST' ? /\/activity/ : /\/notifications/);
  }
});

test('signed opt-out links bind the member and category; GET does not change preferences', async () => {
  for (const category of ['INTEREST', 'PRIVATE_ACCESS', 'ALL']) {
    const token = email.unsubscribeToken(id, category);
    assert.equal(email.verifyUnsubscribeToken(id, category, token), true);
    assert.equal(email.verifyUnsubscribeToken(id, category + 'X', token), false);
    const calls = [];
    const route = load('src/app/api/email/unsubscribe/route.ts', {
      '@/lib/notifications/returnEmails': email,
      '@/lib/supabase/server': { getServerSupabase: () => ({ rpc: async (...args) => { calls.push(args); return {}; } }) },
    });
    const url = `https://example.invalid/api/email/unsubscribe?${new URLSearchParams({ u: id, c: category, t: token })}`;
    assert.equal((await route.GET({ url, method: 'GET' })).status, 200); assert.equal(calls.length, 0);
    assert.equal((await route.POST({ url, method: 'POST' })).status, 200);
    assert.deepEqual(calls, [['intimo_email_opt_out', { p_profile: id, p_category: category }]]);
  }
});

function dispatcher(category, { prepare = true, identityConfirmed = true, providerFails = false } = {}) {
  const calls = [], sent = [];
  const db = {
    from() { const q = new Proxy({}, { get(_, key) { return key === 'then' ? resolve => resolve({ data: { email: 'fixture@example.invalid' } }) : () => q; } }); return q; },
    auth: { admin: { getUserById: async () => ({ data: { user: { email: 'fixture@example.invalid', email_confirmed_at: identityConfirmed ? '2026-10-24' : null } } }) } },
    rpc: async (name, args) => {
      calls.push({ name, args });
      if (name === 'intimo_claim_unread_emails') return { data: [{ id: 'job', lease_id: 'lease', profile_id: id, category }] };
      if (name === 'intimo_prepare_unread_email') return { data: prepare ? args.p_payload : null };
      return { data: true };
    },
  };
  const worker = load('src/lib/notifications/unreadEmailWorker.ts', {
    './returnEmails': email,
    './resendClient': { ResendClient: { DEFAULT_SENDER: 'Intimo <fixture@example.invalid>', DEFAULT_REPLY_TO: 'fixture@example.invalid' } },
    './queuedEmail.mjs': { sendQueuedEmail: async (payload, job) => { sent.push({ payload, job }); if (providerFails) throw Error('provider_http_503'); return { id: 'provider-receipt' }; } },
  });
  return { run: () => worker.dispatchUnreadEmails(db), calls, sent };
}
test('both social categories use the existing prepare/send/ack worker and discreet subject', async () => {
  for (const category of ['INTEREST', 'PRIVATE_ACCESS']) {
    const x = dispatcher(category); assert.deepEqual(await x.run(), { accepted: 1, skipped: 0, retry: 0 });
    assert.equal(x.sent.length, 1); assert.equal(x.sent[0].job, 'job');
    assert.equal(x.sent[0].payload.subject, 'You have an update on Intimo');
    assert.match(x.sent[0].payload.headers['List-Unsubscribe'], new RegExp(`c=${category}`));
    assert.equal(x.calls.at(-1).args.p_provider_id, 'provider-receipt');
  }
});
test('dispatch cancellation and unconfirmed identity never reach the provider; provider errors retain retry state', async () => {
  let x = dispatcher('INTEREST', { prepare: false }); assert.deepEqual(await x.run(), { accepted: 0, skipped: 1, retry: 0 }); assert.equal(x.sent.length, 0);
  x = dispatcher('PRIVATE_ACCESS', { identityConfirmed: false }); assert.deepEqual(await x.run(), { accepted: 0, skipped: 0, retry: 1 }); assert.equal(x.sent.length, 0); assert.equal(x.calls.at(-1).args.p_error, 'recipient_identity_unconfirmed');
  x = dispatcher('PRIVATE_ACCESS', { providerFails: true }); assert.deepEqual(await x.run(), { accepted: 0, skipped: 0, retry: 1 }); assert.equal(x.calls.at(-1).args.p_error, 'provider_http_503');
});
