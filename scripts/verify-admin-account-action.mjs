/** Synthetic local UI rehearsal. No member session, real API write or account ban. */
import assert from 'node:assert/strict';
import { access, mkdir, writeFile, unlink, rmdir, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
const directory = 'src/app/register/account-action-fixture';
const file = `${directory}/page.tsx`;
try { await access(file); throw Error('Refusing to overwrite existing fixture'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const output = await mkdtemp(`${tmpdir()}/intimo-account-action-`);
await mkdir(directory, { recursive: true });
await writeFile(file, `'use client';\nimport React from 'react';\nimport { AdminAccountAction } from '@/components/admin/AdminAccountAction';\nexport default function Fixture({searchParams}:{searchParams:{action?:string}}){const [done,setDone]=React.useState(false);return <main className="mx-auto max-w-3xl p-4">{done ? <p>Member record refreshed</p> : <AdminAccountAction member={{id:'12345678-1234-4123-8123-123456789012',display_name:'Synthetic member'}} action={searchParams.action || 'BAN'} onCancel={()=>setDone(true)} onComplete={()=>setDone(true)}/>}</main>}\n`);
const server = spawn('npm', ['run', 'dev', '--', '--hostname', '127.0.0.1', '--port', '3111'], { stdio: ['ignore', 'ignore', 'inherit'], detached: true });
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt++) { try { if ((await fetch('http://127.0.0.1:3111/register/account-action-fixture')).ok) { ready = true; break; } } catch {} await new Promise(resolve => setTimeout(resolve, 1000)); }
  assert.ok(ready, 'Fixture failed to start');
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const width of [390, 1440]) {
    for (const action of ['BAN', 'DELETE']) {
    const expected = action === 'DELETE' ? 'DELETE 12345678-1234-4123-8123-123456789012' : 'CONFIRM BAN';
    for (const mode of ['stale', 'success', 'network']) {
      const context = await browser.newContext({ viewport: { width, height: 1000 } });
      const page = await context.newPage(); let writes = 0;
      await page.route('**/api/auth/session', route => route.fulfill({ status: 401, json: { authenticated: false } }));
      await page.route('**/api/access/age-declaration', route => route.fulfill({ json: { declared: true } }));
      await page.route('**/api/admin/users/**', route => {
        writes++; assert.equal(route.request().postDataJSON().confirmation, expected);
        assert.equal(route.request().method(), action === 'DELETE' ? 'POST' : 'PATCH');
        assert.equal(new URL(route.request().url()).pathname.endsWith('/deletion'), action === 'DELETE');
        if (mode === 'network') return route.abort('failed');
        return route.fulfill(mode === 'stale' ? { status: 409, json: { code: 'RECENT_AUTH_REQUIRED', error: 'Sign in again to continue.' } } : { json: { user: { account_status: 'BANNED' } } });
      });
      await page.goto(`http://127.0.0.1:3111/register/account-action-fixture?action=${action}`);
      await page.getByRole('button', { name: "Yes, I'm 18+" }).click();
      const apply = page.getByRole('button', { name: action === 'DELETE' ? 'Delete user' : 'Apply ban', exact: true });
      await page.getByLabel('Auditable reason').fill('Reviewed synthetic account evidence');
      assert.equal(await apply.isDisabled(), true);
      await page.getByLabel(`Type ${expected} to confirm`).fill('CONFIRM SUSPEND');
      assert.equal(await apply.isDisabled(), true); assert.equal(writes, 0);
      await page.getByLabel(`Type ${expected} to confirm`).fill(expected);
      if (action === 'DELETE') await page.getByText(/Final erasure is eligible after 30 days/).waitFor();
      await apply.click();
      if (mode === 'success') await page.getByText('Member record refreshed').waitFor();
      else {
        await page.locator('p[role="alert"]').waitFor(); assert.equal(await apply.isDisabled(), true);
        if (mode === 'stale') {
          const href = await page.getByRole('link', { name: 'Sign in again', exact: true }).getAttribute('href');
          const login = new URL(href, 'https://example.test');
          assert.equal(login.pathname, '/login'); assert.match(login.searchParams.get('returnTo'), /^\/admin\/users\?q=/);
          await page.screenshot({ path: `${output}/stale-${action}-${width}.png`, fullPage: true });
        } else {
          await page.getByRole('button', { name: 'Refresh member record' }).click();
          await page.getByText('Member record refreshed').waitFor();
        }
      }
      assert.equal(writes, 1); assert.equal(await page.locator('body').evaluate(element => element.scrollWidth > innerWidth), false);
      await context.close();
    }
    console.log(`PASS ${width}px ${action}: typed confirmation, stale sign-in recovery, successful decision and uncertain-result refresh`);
    }
  }
  console.log(`Screenshots: ${output}`);
} finally {
  await browser?.close();
  await unlink(file); await rmdir(directory);
  await unlink('.next/types/app/register/account-action-fixture/page.ts').catch(error => { if (error.code !== 'ENOENT') throw error; });
  try { process.kill(-server.pid, 'SIGTERM'); } catch {}
}
