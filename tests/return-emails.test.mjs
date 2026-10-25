import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFile(path.join(root, file), "utf8");

test("return emails are throttled, skipped when active or opted out, and discreet", async () => {
  const source = await read("src/lib/notifications/returnEmails.ts");
  const queue = await read("supabase/migrations/20261022044018_durable_unread_message_emails.sql");
  assert.match(queue, /interval '3 hours'/);
  assert.match(queue, /interval '10 minutes'/);
  assert.match(queue, /'ALL'=any\(p.email_opt_out\)/);
  assert.match(source, /We never put names or messages in emails/);
  assert.doesNotMatch(source, /display_name|content/);
});

test("unsubscribe links are signed and work without login", async () => {
  const route = await read("src/app/api/email/unsubscribe/route.ts");
  assert.match(route, /verifyUnsubscribeToken\(profileId, category, token\)/);
  assert.doesNotMatch(route, /resolveServerActor/);
  const lib = await read("src/lib/notifications/returnEmails.ts");
  assert.match(lib, /timingSafeEqual/);
});

test("events trigger return emails", async () => {
  assert.doesNotMatch(await read("src/app/api/messages/route.ts"), /maybeSendReturnEmail\(/);
  const queue = await read("supabase/migrations/20261022044018_durable_unread_message_emails.sql");
  assert.match(queue, /create trigger queue_unread_email after insert on public.direct_messages/);
  assert.doesNotMatch(await read("src/app/api/interests/route.ts"), /maybeSendReturnEmail|ResendClient/);
  assert.doesNotMatch(await read("src/app/api/private-access/route.ts"), /maybeSendReturnEmail|ResendClient/);
  const sql = await read("supabase/migrations/20261026000000_return_emails.sql");
  assert.match(sql, /revoke all on public\.email_send_state from anon, authenticated;/);
});

test("queued delivery retries use the same provider key and exact payload", async () => {
  const { sendQueuedEmail } = await import('../src/lib/notifications/queuedEmail.mjs');
  const calls = [];
  const payload = { to: 'fixture@example.invalid', subject: 'You have an update on Intimo', html: '<p>Open Intimo</p>' };
  const fakeFetch = async (url, options) => {
    calls.push({ url, ...options });
    return calls.length === 1 ? new Response('{}', { status: 503 }) : new Response('{"id":"accepted-once"}');
  };
  await assert.rejects(sendQueuedEmail(payload, 'job-1', { apiKey: 'fixture-only', fetchImpl: fakeFetch }), /provider_http_503/);
  const accepted = await sendQueuedEmail(payload, 'job-1', { apiKey: 'fixture-only', fetchImpl: fakeFetch });
  assert.equal(accepted.accepted, true);
  assert.equal(calls[0].headers['Idempotency-Key'], calls[1].headers['Idempotency-Key']);
  assert.equal(calls[0].body, calls[1].body);
  assert.equal(calls[0].redirect, 'error');
});

test("queued delivery never simulates acceptance or includes provider details in errors", async () => {
  const { sendQueuedEmail } = await import('../src/lib/notifications/queuedEmail.mjs');
  await assert.rejects(sendQueuedEmail({}, 'job', { apiKey: '' }), /provider_not_configured/);
  await assert.rejects(sendQueuedEmail({}, 'job', { apiKey: 'fixture', fetchImpl: async () => new Response('sensitive@example.invalid', { status: 429 }) }), /^EmailDeliveryError: provider_http_429$/);
  await assert.rejects(sendQueuedEmail({}, 'job', { apiKey: 'fixture', fetchImpl: async () => new Response('{}') }), /provider_invalid_receipt/);
});
