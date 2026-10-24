/** Local component/browser rehearsal with synthetic responses. Never uses a member session. */
import assert from 'node:assert/strict';
import { mkdir, writeFile, unlink, rmdir, mkdtemp, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
const fixtureDir = 'src/app/register/workspace-fixture';
const fixtureFile = `${fixtureDir}/page.tsx`;
try { await access(fixtureFile); throw Error('Refusing to overwrite existing fixture'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const output = await mkdtemp(`${tmpdir()}/intimo-workspace-qa-`);
const id = '12345678-1234-4123-8123-123456789012';
const photoId = '22345678-1234-4123-8123-123456789012';
const memberId = '32345678-1234-4123-8123-123456789012';
const actor = { profileId: 'admin', email: 'qa@example.invalid', role: 'SUPER_ADMIN', mfaAuthenticated: true, permissions: ['dashboard:view', 'content:view', 'content:moderate', 'content:reveal_sensitive', 'users:view_basic', 'verification:view', 'verification:decide', 'moderation:view', 'moderation:decide', 'moderation:critical', 'privacy:view', 'audit:view', 'settings:view'] };
await mkdir(fixtureDir, { recursive: true });
await writeFile(fixtureFile, `import { AdminWorkspaceShell } from '@/components/admin/AdminWorkspaceShell';\nimport { AdminWorkInbox } from '@/components/admin/AdminWorkInbox';\nexport default function Fixture(){ const actor=${JSON.stringify(actor)} as any; return <AdminWorkspaceShell actor={actor}><AdminWorkInbox actor={actor}/></AdminWorkspaceShell> }\n`);
const server = spawn('npm', ['run', 'dev', '--', '--hostname', '127.0.0.1', '--port', '3100'], { stdio: ['ignore', 'ignore', 'inherit'], detached: true });
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt++) { try { const response = await fetch('http://127.0.0.1:3100/register/workspace-fixture'); if (response.ok) { ready = true; break; } } catch {} await new Promise(resolve => setTimeout(resolve, 1000)); }
  assert.ok(ready, 'Local fixture did not start');
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 } }); const page = await context.newPage(); page.setDefaultTimeout(15000);
    const patches = []; let approved = false; let failReports = false;
    const photo = () => ({ id: photoId, owner_id: memberId, title: 'Sunlight', moderation_status: approved ? 'APPROVED' : 'PENDING_REVIEW', upload_status: 'AVAILABLE', processing_status: 'READY' });
    await page.route('**/api/auth/session', route => route.fulfill({ status: 401, json: { authenticated: false } }));
    await page.route('**/api/access/age-declaration', route => route.fulfill({ json: { declared: true } }));
    await page.route('**/api/admin/**', async route => {
      const request = route.request(); const url = new URL(request.url());
      if (request.method() === 'PATCH') { const body = request.postDataJSON(); patches.push({ path: url.pathname, body }); if (url.pathname === '/api/admin/media') approved = true; return route.fulfill({ json: { success: true } }); }
      if (url.pathname.endsWith('/preview')) return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="700" height="500"><rect width="700" height="500" fill="#9ecce2"/><circle cx="350" cy="215" r="85" fill="#232b32"/></svg>' });
      if (url.pathname === '/api/admin/moderation') return failReports ? route.fulfill({ status: 503, json: { error: 'Synthetic report service failure' } }) : route.fulfill({ json: { cases: [{ id: 'report', status: 'OPEN', priority: 'CRITICAL', reason: 'HARASSMENT', content_type: 'PROFILE', created_at: '2026-10-23T08:00:00Z', reported_user_id: memberId }] } });
      if (url.pathname === '/api/admin/albums') return route.fulfill({ json: { albums: [{ id, title: 'After hours', owner_id: memberId, visibility: 'MEMBERS_ONLY', moderation_status: 'PENDING_REVIEW', created_at: '2026-10-23T09:00:00Z' }, { id: 'empty', title: 'Empty album', moderation_status: 'PENDING_REVIEW', created_at: '2026-10-23T10:00:00Z' }] } });
      if (url.pathname.endsWith('/photos')) return route.fulfill({ json: { photos: url.pathname.includes('/empty/') ? [] : [photo()] } });
      if (url.pathname === '/api/admin/media') return route.fulfill({ json: { media: [] } });
      if (url.pathname === '/api/admin/verification') return route.fulfill({ json: { reviews: [] } });
      if (url.pathname.startsWith('/api/admin/users/')) return route.fulfill({ json: { user: { display_name: 'Synthetic member', account_status: 'ACTIVE', created_at: '2026-09-01' }, actions: [] } });
      return route.fulfill({ status: 404, json: { error: 'Unmocked request' } });
    });
    await page.goto('http://127.0.0.1:3100/register/workspace-fixture');
    await page.getByRole('button', { name: "Yes, I'm 18+" }).click();
    await page.getByRole('button', { name: /After hours Album/ }).click();
    await page.getByRole('button', { name: 'Enlarge', exact: true }).click(); await page.getByRole('dialog', { name: /Enlarged/ }).waitFor(); await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('button', { name: 'Approve album', exact: true }).isDisabled(), true);
    await page.getByLabel('Decision reason', { exact: true }).selectOption('Meets community guidelines'); await page.getByLabel('Review note', { exact: true }).fill('All visible content meets the community guidelines.');
    await page.getByRole('button', { name: 'Approve photo 1', exact: true }).click();
    await page.getByLabel('Decision reason', { exact: true }).selectOption('Meets community guidelines'); await page.getByLabel('Review note', { exact: true }).fill('The whole album is now ready for publication.');
    assert.equal(await page.getByRole('button', { name: 'Approve album', exact: true }).isEnabled(), true);
    const primaryColor = await page.getByRole('button', { name: 'Approve album', exact: true }).evaluate(button => getComputedStyle(button).backgroundColor);
    assert.ok(Number(primaryColor.match(/\d+/)?.[0]) > 100, 'Primary approval button must have the light accent background');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${output}/workspace-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Request changes', exact: true }).click();
    assert.equal(patches.at(-1).body.requestChanges, true); assert.equal(patches.at(-1).body.decision, 'REJECTED');
    if (width < 1280) await page.getByRole('button', { name: 'Back to queue' }).click();
    await page.getByRole('button', { name: /Empty album Album/ }).click(); await page.getByText('This album has no photos. It cannot be approved.').waitFor();
    assert.equal(await page.getByRole('button', { name: 'Approve album', exact: true }).isDisabled(), true);
    failReports = true; await page.getByRole('button', { name: 'Refresh', exact: true }).click(); await page.getByText('Some queues could not be loaded.').waitFor();
    assert.equal(await page.locator('body').evaluate(element => element.scrollWidth > innerWidth), false, 'Workspace overflows');
    await page.goto('http://127.0.0.1:3100/tonight/new');
    const title = page.getByRole('textbox', { name: 'What would you like to do?' });
    await title.fill('A long invitation title that must remain inside the form without breaking layout');
    await page.getByRole('textbox', { name: 'A few words for whoever reads it' }).fill('A relaxed invitation with clear boundaries and a public first meeting.');
    const start = page.getByLabel('Starts at', { exact: true }); const end = page.getByLabel('Ends at', { exact: true });
    await start.selectOption('19:00'); await end.selectOption('22:00');
    assert.equal(await start.inputValue(), '19:00'); assert.equal(await end.inputValue(), '22:00');
    assert.equal(await page.locator('body').evaluate(element => element.scrollWidth > innerWidth), false, 'Invitation overflows');
    await page.screenshot({ path: `${output}/invitation-${width}.png`, fullPage: true });
    console.log(`PASS ${width}px: review, enlarge/Escape, photo-before-album approval, changes requested, empty/error queues, invitation controls`);
    await context.close();
  }
  console.log(`Screenshots: ${output}`);
} catch (error) {
  const page = browser?.contexts()[0]?.pages()[0];
  if (page) { await page.screenshot({ path: `${output}/failure.png`, fullPage: true }); console.log(`Failure screenshot: ${output}/failure.png`); }
  throw error;
} finally {
  await browser?.close(); try { process.kill(-server.pid, 'SIGTERM'); } catch {}
  await unlink(fixtureFile); await rmdir(fixtureDir);
  // Next dev creates a route type for this temporary fixture. Do not leave it
  // pointing at a removed page when the next command runs tsc.
  await unlink(new URL('../.next/types/app/register/workspace-fixture/page.ts', import.meta.url)).catch(error => { if (error.code !== 'ENOENT') throw error; });
}
