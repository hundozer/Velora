import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const read = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const require = createRequire(import.meta.url);
const cryptoSource = read("src/lib/onboarding/draftCrypto.ts");
const js = ts.transpileModule(cryptoSource, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
}}).outputText;
function load() {
  const m = { exports: {} };
  new Function("module","exports","require",js)(m,m.exports,require);
  return m.exports;
}

test("draft AES-GCM is bound to verified account ID and ciphertext is not plaintext", () => {
  const before = process.env.INTIMO_ONBOARDING_DRAFT_KEY;
  try {
    process.env.INTIMO_ONBOARDING_DRAFT_KEY = "c".repeat(64);
    const { encryptDraft, decryptDraft, draftExpiry, draftsEnabled } = load();
    assert.equal(draftsEnabled(), true);
    const draft = { displayName:"Private Nickname", dateOfBirth:"1990-01-02", lookingFor:["FRIENDSHIP"] };
    const saved = encryptDraft(draft,"account-a");
    assert.doesNotMatch(saved.ciphertext,/Private Nickname|1990-01-02/);
    assert.deepEqual(decryptDraft(saved.ciphertext,saved.nonce,"account-a"),draft);
    assert.throws(()=>decryptDraft(saved.ciphertext,saved.nonce,"account-b"));
    assert.throws(()=>decryptDraft(saved.ciphertext.slice(0,-3)+"abc",saved.nonce,"account-a"));
    assert.equal(draftExpiry(1000),new Date(1000+7*86400000).toISOString());
  } finally {
    if(before === undefined) delete process.env.INTIMO_ONBOARDING_DRAFT_KEY;
    else process.env.INTIMO_ONBOARDING_DRAFT_KEY = before;
  }
});

test("draft API is unprovisioned verified owner only, no direct browser role access", () => {
  const api = read("src/app/api/onboarding/draft/route.ts");
  const sql = read("supabase/migrations/20261121010000_onboarding_drafts.sql");
  assert.match(api,/getVerifiedIdentity\(\)/);
  assert.match(api,/!identity\?\.emailVerified/);
  assert.match(api,/\.eq\("auth_id", identity\.sub\)/);
  assert.match(api,/\.eq\("user_id", ctx\.subject\)/);
  assert.match(api,/saveConsent !== true/);
  assert.match(api,/checkRateLimit/);
  assert.match(api,/new URL\(req\.url\)\.origin/);
  assert.match(api,/async function access\(allowCompleted = false\)/);
  assert.match(api,/const ctx = await access\(true\)/);
  assert.match(sql,/references auth\.users\(id\) on delete cascade/);
  assert.match(sql,/enable row level security/);
  assert.match(sql,/revoke all on public\.onboarding_drafts from public, anon, authenticated/);
  assert.match(sql,/grant select, insert, update, delete on public\.onboarding_drafts to service_role/);
  assert.match(sql,/cron\.schedule/);
});

test("draft UI requires explicit save, restores without local storage and preserves invitation checks", () => {
  const page = read("src/app/onboarding/page.tsx");
  assert.match(page,/saveConsent: true, draft/);
  assert.match(page,/checked=\{draftConsent\}/);
  assert.match(page,/disabled=\{draftBusy \|\| !draftConsent\}/);
  assert.match(page,/including sensitive personal preferences/);
  assert.match(page,/Restore saved answers/);
  assert.match(page,/Delete saved answers/);
  assert.match(page,/fetch\("\/api\/onboarding\/draft"/);
  assert.match(page,/if \(!validInviteLink\) return/);
  assert.doesNotMatch(page,/sessionStorage|localStorage|indexedDB/);
  assert.match(page,/inviteToken,/);
  const chrome=read("src/components/flow/Flow.tsx");
  assert.match(chrome,/utility\?: React\.ReactNode/);
});

test("draft keys never exposed through NEXT_PUBLIC and no logging of personal answers", () => {
  const crypto=read("src/lib/onboarding/draftCrypto.ts");
  const api=read("src/app/api/onboarding/draft/route.ts");
  assert.match(crypto,/process\.env\.INTIMO_ONBOARDING_DRAFT_KEY/);
  assert.doesNotMatch(crypto+api,/process\\.env\\.NEXT_PUBLIC_|console\.log|console\.error/);
});
