// FM-09: optional identity details with an audience per detail, behind the profile consent.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import * as identity from "../src/lib/identity.mjs";
import * as registry from "../src/lib/privacy/consents.mjs";

const { cleanNote, cleanIdentityInput, needsSensitiveConsent, visibleIdentity } = identity;
const require = createRequire(import.meta.url);
const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
function load(file, mocks) {
  const code = ts.transpileModule(read(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)((name) => (name in mocks ? mocks[name] : require(name)), module, module.exports);
  return module.exports;
}
const PROFILE = "12345678-1234-4123-8123-123456789012";

test("notes are tidied and refuse links, contact details and over-long text", () => {
  assert.equal(cleanNote("  mostly \n into   women ", 60), "mostly into women");
  assert.equal(cleanNote("   ", 60), null);
  assert.equal(cleanNote(undefined, 60), null);
  for (const value of ["text me on insta @jana", "see www.example.cz", "https://x.y", "jana.novak.com", "call 777123456", "write me at jana(at)mail.cz"]) {
    assert.deepEqual(cleanNote(value, 60), { error: "contact" }, value);
  }
  assert.deepEqual(cleanNote("x".repeat(61), 60), { error: "too_long" });
  assert.equal(cleanNote("ž".repeat(60), 60), "ž".repeat(60), "length counts characters, matching the database check");
  assert.deepEqual(cleanNote(42, 60), { error: "invalid" });
});

test("a submission maps to columns with safe defaults and needs consent only for special-category data", () => {
  const { value } = cleanIdentityInput({ orientation: "QUEER", orientationNote: "", genderNote: "genderfluid", pronouns: "they/them" });
  assert.deepEqual(value, { sexual_orientation: "QUEER", orientation_note: null, gender_note: "genderfluid", pronouns: "they/them", identity_visibility: { orientation: "PRIVATE", gender_note: "PRIVATE", pronouns: "MEMBERS_ONLY" } });
  assert.equal(needsSensitiveConsent(value), true);
  assert.equal(needsSensitiveConsent(cleanIdentityInput({ orientation: null, pronouns: "she/her" }).value), false, "pronouns alone need no special-category consent");
  assert.deepEqual(cleanIdentityInput({ orientation: "ASEXUALX" }), { error: "invalid", field: "orientation" });
  assert.deepEqual(cleanIdentityInput({ visibility: { orientation: "EVERYONE" } }), { error: "invalid", field: "visibility.orientation" });
  assert.deepEqual(cleanIdentityInput({ pronouns: "x".repeat(25) }), { error: "too_long", field: "pronouns" });
});

test("each detail is shown only to its audience; a row without the map shows nothing", () => {
  const row = { sexual_orientation: "BISEXUAL", orientation_note: "bi and curious", gender_note: "trans woman", pronouns: "she/her", sensitive_fields_visibility: "MEMBERS_ONLY", identity_visibility: { orientation: "FRIENDS_ONLY", gender_note: "PRIVATE", pronouns: "MEMBERS_ONLY" } };
  assert.deepEqual(visibleIdentity(row, {}), { pronouns: "she/her" });
  assert.deepEqual(visibleIdentity(row, { friends: true }), { sexualOrientation: "BISEXUAL", orientationNote: "bi and curious", pronouns: "she/her" });
  assert.deepEqual(visibleIdentity(row, { owner: true }), { sexualOrientation: "BISEXUAL", orientationNote: "bi and curious", genderNote: "trans woman", pronouns: "she/her" });
  // Narrow column lists (discovery) never widen an audience.
  const { identity_visibility: _omitted, ...narrow } = row;
  assert.deepEqual(visibleIdentity(narrow, { friends: true }), {});
  // Before a member uses the editor, orientation keeps following the old sensitive-fields setting.
  assert.deepEqual(visibleIdentity({ sexual_orientation: "QUEER", sensitive_fields_visibility: "MEMBERS_ONLY", identity_visibility: {} }, {}), { sexualOrientation: "QUEER" });
  assert.deepEqual(visibleIdentity({ sexual_orientation: "QUEER", sensitive_fields_visibility: "PRIVATE", identity_visibility: {} }, {}), {});
});

test("member profiles use the per-detail audiences", () => {
  const serializer = read("src/lib/supabase/publicProfile.ts");
  assert.match(serializer, /const identity = visibleIdentity\(row as unknown as Record<string, unknown>, audience\)/);
  assert.match(serializer, /sexualOrientation: identity\.sexualOrientation,/);
  assert.doesNotMatch(serializer, /sexualOrientation: sensitiveVisible/);
  assert.match(read("src/app/api/profiles/[id]/route.ts"), /friends: friends \|\| isOwner \|\| isAdmin, owner: isOwner/);
});

/** Runs the identity API against a recording fake database. */
function api({ consents = [], updateError = null, selectError = null, row = null } = {}) {
  const calls = [];
  const audits = [];
  const db = { from(table) {
    const call = { table, op: "select", values: null, filters: [] }; calls.push(call);
    const q = {
      select() { return q; }, maybeSingle() { return q; },
      insert(values) { call.op = "insert"; call.values = values; return q; },
      update(values) { call.op = "update"; call.values = values; return q; },
      eq(column, value) { call.filters.push([column, value]); return q; },
      then(resolve) {
        if (table === "user_consents" && call.op === "select") return resolve({ data: consents, error: null });
        if (table === "profiles" && call.op === "update") return resolve({ error: updateError });
        if (table === "profiles") return resolve({ data: row, error: selectError });
        resolve({ error: null });
      },
    };
    return q;
  } };
  const route = load("src/app/api/profile/identity/route.ts", {
    "@/lib/auth/serverActor": { resolveServerActor: async () => ({ status: "authenticated", actor: { profileId: PROFILE, userId: "user-1" } }) },
    "@/lib/supabase/server": { getServerSupabase: () => db },
    "@/lib/security/rateLimiter": { checkRateLimit: async () => ({ allowed: true }) },
    "@/lib/auth/durableAudit": { appendDurableAudit: async (_db, entry) => { audits.push(entry); return true; } },
    "@/lib/identity.mjs": identity, "@/lib/privacy/consents.mjs": registry,
  });
  return { route, calls, audits, put: (body) => route.PUT({ json: async () => body }) };
}
const granted = [{ consent_type: "SPECIAL_CATEGORY_PROFILE", consent_version: "sensitive-profile-v2", consent_timestamp: "2026-11-18T08:00:00Z", consent_status: "GRANTED" }];

test("saving orientation without consent is refused and nothing is written", async () => {
  const { put, calls } = api();
  const response = await put({ orientation: "QUEER" });
  assert.equal(response.status, 412);
  assert.equal((await response.json()).consentRequired, true);
  assert.ok(!calls.some((c) => c.op === "update" || c.op === "insert"));
});

test("ticking consent records it from the editor, then saves; the audit names fields, not values", async () => {
  const { put, calls, audits } = api();
  const response = await put({ orientation: "QUEER", genderNote: "genderfluid", pronouns: "they/them", consent: true, profileId: "someone-else" });
  assert.equal(response.status, 200);
  const consent = calls.find((c) => c.table === "user_consents" && c.op === "insert");
  assert.deepEqual([consent.values.consent_type, consent.values.consent_status, consent.values.consent_version, consent.values.source, consent.values.profile_id], ["SPECIAL_CATEGORY_PROFILE", "GRANTED", "sensitive-profile-v2", "IDENTITY_EDITOR", PROFILE]);
  const update = calls.find((c) => c.table === "profiles" && c.op === "update");
  assert.deepEqual(update.filters, [["id", PROFILE]], "owner comes from the session");
  assert.equal(update.values.sexual_orientation, "QUEER");
  assert.deepEqual(audits[0].metadata, { filled: ["sexual_orientation", "gender_note", "pronouns"] });
  assert.doesNotMatch(JSON.stringify(audits), /QUEER|genderfluid|they\/them/);
});

test("existing consent or pronouns alone save straight away; contact details are refused", async () => {
  const withConsent = api({ consents: granted });
  assert.equal((await withConsent.put({ orientation: "BISEXUAL" })).status, 200);
  assert.ok(!withConsent.calls.some((c) => c.table === "user_consents" && c.op === "insert"), "no duplicate consent row");
  const pronounsOnly = api();
  assert.equal((await pronounsOnly.put({ pronouns: "she/her" })).status, 200);
  assert.ok(!pronounsOnly.calls.some((c) => c.table === "user_consents"), "pronouns never touch consent");
  const contact = api({ consents: granted });
  const refused = await contact.put({ orientationNote: "dm me @jana" });
  assert.equal(refused.status, 400);
  assert.equal((await refused.json()).field, "orientation_note");
});

test("before the migration the editor says it isn't ready instead of failing", async () => {
  const missing = { code: "42703" };
  const { route } = api({ selectError: missing });
  assert.deepEqual(await (await route.GET({})).json(), { available: false });
  assert.equal((await api({ consents: granted, updateError: missing }).put({ pronouns: "he/him" })).status, 503);
});

test("withdrawing consent clears the new notes, with a fallback while the migration is pending; deletion clears them too", () => {
  assert.deepEqual(registry.CONSENTS.SPECIAL_CATEGORY_PROFILE.erasesProfileColumns, ["sexual_orientation", "orientation_note", "gender_note"]);
  const consents = read("src/app/api/privacy/consents/route.ts");
  assert.match(consents, /if \(eraseError\?\.code === UNDEFINED_COLUMN\) \(\{ error: eraseError \} = await clear\(spec\.erasesProfileColumns\.filter/);
  assert.match(consents, /if \(profileError\?\.code === UNDEFINED_COLUMN\) \{/);
  const retention = read("src/lib/privacy/retention.ts");
  assert.match(retention, /update\(\{ orientation_note: null, gender_note: null, pronouns: null, identity_visibility: \{\} \}\)/);
  assert.match(retention, /identityNotesError\.code !== "42703"/);
  const migration = read("supabase/migrations/20261118120000_identity_fields.sql");
  assert.match(migration, /-- ROLLBACK:/);
  assert.doesNotMatch(migration.replace(/--.*$/gm, ""), /\bdrop\s+column\b|\bdelete\b|\btruncate\b/i, "additive only");
});
