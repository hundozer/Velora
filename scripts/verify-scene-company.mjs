/** Local browser rehearsal of actual pages; synthetic API data, no accounts. */
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { chromium, expect } from '@playwright/test';
const output = await mkdtemp(`${tmpdir()}/intimo-scene-company-`);
const server = spawn('npm', ['run', 'dev', '--', '--hostname', '127.0.0.1', '--port', '3122'], { detached: true, stdio: ['ignore', 'ignore', 'inherit'] });
let browser;
try {
  let ready = false;
  for (let i = 0; i < 50; i++) { try { if ((await fetch('http://127.0.0.1:3122/scene')).ok) { ready = true; break; } } catch {} await new Promise(resolve => setTimeout(resolve, 1000)); }
  assert.ok(ready); browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const startsAt = new Date(Date.now() + 7 * 86400000).toISOString(); const endsAt = new Date(Date.parse(startsAt) + 3 * 3600000).toISOString();
  const event = { id: '78100200-0000-4000-8000-000000000001', title: 'Synthetic Prague Munch', kindLabel: 'Munch', startsAt, endsAt, companyWindow: { startsAt, endsAt }, areaId: 'praha-2', areaName: 'Vinohrady', organiser: 'Synthetic organiser', venueName: 'Synthetic venue', description: 'Synthetic community event.', url: 'https://example.invalid/event' };
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, timezoneId: 'America/New_York' }); const page = await context.newPage(); const writes = []; let unavailable = false;
    await page.route('**/api/auth/session', route => route.fulfill({ json: { provisioned: true, accountState: 'ACTIVE', actor: { id: '78100200-0000-4000-8000-000000000002', email: 'qa@example.invalid', role: 'MEMBER', emailVerified: true } } }));
    await page.route('**/api/profile/me', route => route.fulfill({ json: { profile: { id: '78100200-0000-4000-8000-000000000002', auth_id: '78100200-0000-4000-8000-000000000002', email: 'qa@example.invalid', display_name: 'Synthetic member', account_status: 'ACTIVE', age_verification_status: 'AGE_DECLARED', gender: 'MALE', date_of_birth: '1990-01-01', country: 'CZ', city: 'Prague', area_id: 'praha-2' } } }));
    await page.route('**/api/access/age-declaration', route => route.fulfill({ json: { declared: true } }));
    await page.route('**/api/scene**', route => route.fulfill(unavailable ? { status: 404, json: { error: 'Event unavailable' } } : { json: { events: [event] } }));
    await page.route('**/api/dating-ads**', route => {
      if (route.request().method() === 'POST') { writes.push(route.request().postDataJSON()); return route.fulfill({ status: 201, json: { plan: { id: '78100200-0000-4000-8000-000000000003' } } }); }
      return route.fulfill({ json: { plans: [] } });
    });
    await page.goto('http://127.0.0.1:3122/scene');
    const age = page.getByRole('button', { name: "Yes, I'm 18+" }); if (await age.isVisible()) await age.click();
    await page.getByRole('link', { name: 'Find company', exact: true }).click();
    await page.getByRole('heading', { name: 'Find company for this event', exact: true }).waitFor();
    await page.getByRole('heading', { name: 'Synthetic Prague Munch', exact: true }).waitFor();
    assert.equal(writes.length, 0, 'Opening a draft must not publish interest');
    await expect(page.getByLabel('What would you like to do?')).toHaveValue('Company for Synthetic Prague Munch');
    await page.getByLabel('A few words for whoever reads it').fill('Meet first, respect boundaries, and decide together.');
    const submit = page.getByRole('button', { name: 'Publish invitation', exact: true });
    assert.equal(await submit.isDisabled(), true);
    await page.getByRole('checkbox', { name: /^Publish this invitation to signed-in adult members/ }).check();
    assert.equal(await submit.isEnabled(), true);
    assert.equal(await page.getByLabel('Starts at', { exact: true }).count(), 0, 'Event time must come from the published listing');
    assert.equal(await page.locator('body').evaluate(element => element.scrollWidth > innerWidth), false);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${output}/invitation-${width}.png`, fullPage: true });
    await submit.click(); await page.waitForURL(/\/tonight\/invitation\//);
    await page.goto(`http://127.0.0.1:3122/tonight?event=${event.id}`);
    await expect(page.getByRole('link', { name: 'Invite', exact: true })).toHaveAttribute('href', `/tonight/new?event=${event.id}`);
    assert.equal(writes.length, 1); assert.equal(writes[0].sceneEventId, event.id); assert.equal(writes[0].publishEventInvitation, true);
    assert.equal(writes[0].startsAt, startsAt); assert.equal(writes[0].endsAt, endsAt);
    unavailable = true; await page.goto(`http://127.0.0.1:3122/tonight/new?event=${event.id}`);
    await page.getByRole('alert').filter({ hasText: 'This event is unavailable' }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Publish invitation', exact: true }).isDisabled(), true);
    assert.equal(writes.length, 1);
    console.log(`PASS ${width}px: draft privacy, event prefill, Prague time across browser timezone, publication consent, payload and unavailable event`);
    await context.close();
  }
  console.log(`Screenshots: ${output}`);
} finally { await browser?.close(); try { process.kill(-server.pid, 'SIGTERM'); } catch {} }
