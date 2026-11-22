import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../src/lib/auth/adminAuthorization.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const exports = {}; new Function('require', 'exports', code)(name => name === './serverActor' ? {} : require(name), exports);
const actor = { profileId: 'owner-uuid', role: 'SUPER_ADMIN', adminAuthorized: true, accountStatus: 'ACTIVE', emailVerified: true, mfaAuthenticated: false };
test('temporary owner MFA bypass is strictly scoped and expires automatically', () => {
  const previous = { ...process.env };
  try {
    process.env.NODE_ENV = 'production';
    process.env.INTIMO_TEMP_MFA_BYPASS_PROFILE_ID = actor.profileId;
    process.env.INTIMO_TEMP_MFA_BYPASS_STARTS_AT = '2026-11-22T04:00:00.000Z';
    process.env.INTIMO_TEMP_MFA_BYPASS_EXPIRES_AT = '2026-11-23T04:00:00.000Z';
    const fn = exports.temporaryOwnerMfaException;
    const start = Date.parse(process.env.INTIMO_TEMP_MFA_BYPASS_STARTS_AT);
    const end = Date.parse(process.env.INTIMO_TEMP_MFA_BYPASS_EXPIRES_AT);
    assert.equal(fn(actor, start - 1), false);
    assert.equal(fn(actor, start), true);
    assert.equal(fn(actor, end - 1), true);
    assert.equal(fn(actor, end), false);
    for (const change of [
      { profileId: 'other' }, { role: 'SYSTEM_ADMIN' }, { adminAuthorized: false },
      { accountStatus: 'SUSPENDED' }, { emailVerified: false }
    ]) assert.equal(fn({ ...actor, ...change }, start + 1), false);
    process.env.INTIMO_TEMP_MFA_BYPASS_EXPIRES_AT = '2026-11-23T04:00:01.000Z';
    assert.equal(fn(actor, start + 1), false, 'over 24 hours must fail closed');
    process.env.INTIMO_TEMP_MFA_BYPASS_EXPIRES_AT = 'invalid';
    assert.equal(fn(actor, start + 1), false);
    delete process.env.INTIMO_TEMP_MFA_BYPASS_PROFILE_ID;
    assert.equal(fn(actor, start + 1), false);
  } finally {
    process.env = previous;
  }
});
