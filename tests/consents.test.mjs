// FM-01: separate, versioned consents; withdrawal deletes what the consent covered.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import * as registry from "../src/lib/privacy/consents.mjs";

const { CONSENTS, consentStates, consentRow } = registry;
const require = createRequire(import.meta.url);
const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
function load(file, mocks) {
  const code = ts.transpileModule(read(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)((name) => (name in mocks ? mocks[name] : require(name)), module, module.exports);
  return module.exports;
}
const PROFILE = "12345678-1234-4123-8123-123456789012";

test("state per consent: latest row wins, earlier wordings of the same scope still count", () => {
  const rows = [
    { consent_type: "SPECIAL_CATEGORY_PROFILE", consent_version: "sensitive-profile-v1", consent_timestamp: "2026-10-01T10:00:00Z", consent_status: "GRANTED" },
    { consent_type: "SPECIAL_CATEGORY_DESIRES", consent_version: "desires-v1", consent_timestamp: "2026-10-02T10:00:00Z", consent_status: "GRANTED" },
    { consent_type: "SPECIAL_CATEGORY_DESIRES", consent_version: "desires-v1", consent_timestamp: "2026-10-05T10:00:00Z", consent_status: "WITHDRAWN" },
  ];
  const states = consentStates(rows);
  assert.equal(states.SPECIAL_CATEGORY_PROFILE.granted, true);
  assert.equal(states.SPECIAL_CATEGORY_PROFILE.since, "2026-10-01T10:00:00Z");
  assert.equal(states.SPECIAL_CATEGORY_DESIRES.granted, false, "withdrawal after a grant wins");
  // A grant of a wording that is no longer accepted must be renewed.
  const stale = consentStates([{ consent_type: "SPECIAL_CATEGORY_PROFILE", consent_version: "sensitive-profile-v0", consent_timestamp: "2026-09-01T00:00:00Z", consent_status: "GRANTED" }]);
  assert.deepEqual([stale.SPECIAL_CATEGORY_PROFILE.granted, stale.SPECIAL_CATEGORY_PROFILE.needsRenewal], [false, true]);
  assert.deepEqual(consentStates([]).SPECIAL_CATEGORY_PROFILE, { granted: false, needsRenewal: false, version: null, since: null, currentVersion: "sensitive-profile-v2" });
});

test("every consent records its current version; the shown wording matches the registry", () => {
  const row = consentRow({ profileId: PROFILE, type: "SPECIAL_CATEGORY_PROFILE", granted: false, source: "PRIVACY_CENTER", now: "2026-11-18T08:00:00.000Z" });
  assert.deepEqual(row, { profile_id: PROFILE, consent_type: "SPECIAL_CATEGORY_PROFILE", consent_version: "sensitive-profile-v2", consent_timestamp: "2026-11-18T08:00:00.000Z", consent_status: "WITHDRAWN", withdrawn_at: "2026-11-18T08:00:00.000Z", source: "PRIVACY_CENTER" });
  for (const spec of Object.values(CONSENTS)) assert.ok(spec.acceptedVersions.includes(spec.version));
  const ui = read("src/components/settings/ConsentSettings.tsx");
  const doc = read("docs/CONSENT.md");
  for (const [type, spec] of Object.entries(CONSENTS)) {
    assert.ok(ui.includes(`t("${spec.wording}")`), `Settings shows the exact ${type} wording`);
    assert.ok(doc.includes(spec.wording) && doc.includes(spec.version), `docs/CONSENT.md records ${type} ${spec.version}`);
  }
  // Sign-up and the desires editor use the registry versions, not their own strings.
  assert.match(read("src/app/api/profile/me/route.ts"), /consent_version: CONSENTS\.SPECIAL_CATEGORY_PROFILE\.version/);
  assert.match(read("src/lib/privacy/desireConsent.ts"), /DESIRE_CONSENT_VERSION = CONSENTS\.SPECIAL_CATEGORY_DESIRES\.version/);
  assert.match(read("src/app/me/desires/page.tsx"), new RegExp(CONSENTS.SPECIAL_CATEGORY_DESIRES.wording.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

/** Runs POST /api/privacy/consents against a recording fake database. */
async function post(body, { failErase = false } = {}) {
  const calls = [];
  const db = { from(table) {
    const call = { table, op: null, values: null, filters: [] }; calls.push(call);
    const q = {
      insert(values) { call.op = "insert"; call.values = values; return q; },
      update(values) { call.op = "update"; call.values = values; return q; },
      delete() { call.op = "delete"; return q; },
      eq(column, value) { call.filters.push([column, value]); return q; },
      then(resolve) { resolve({ error: failErase && call.op !== "insert" ? { code: "boom" } : null }); },
    };
    return q;
  } };
  const audits = [];
  const route = load("src/app/api/privacy/consents/route.ts", {
    "@/lib/auth/serverActor": { resolveServerActor: async () => ({ status: "authenticated", actor: { profileId: PROFILE, userId: "user-1", role: "MEMBER" } }) },
    "@/lib/supabase/server": { getServerSupabase: () => db },
    "@/lib/security/rateLimiter": { checkRateLimit: async () => ({ allowed: true }) },
    "@/lib/auth/auditLogger": { auditLogger: { logEvent: () => {} } },
    "@/lib/auth/durableAudit": { appendDurableAudit: async (_db, entry) => { audits.push(entry.action); return true; } },
    "@/lib/privacy/consents.mjs": registry,
  });
  const response = await route.POST({ json: async () => body });
  return { response, calls, audits };
}

test("withdrawing orientation consent records it, then deletes the orientation", async () => {
  const { response, calls, audits } = await post({ consentType: "SPECIAL_CATEGORY_PROFILE", granted: false });
  assert.equal(response.status, 200);
  assert.equal(calls[0].table, "user_consents");
  assert.equal(calls[0].op, "insert");
  assert.equal(calls[0].values.consent_status, "WITHDRAWN");
  assert.equal(calls[0].values.consent_version, "sensitive-profile-v2");
  assert.equal(calls[0].values.profile_id, PROFILE, "owner comes from the session, never the request");
  assert.deepEqual([calls[1].table, calls[1].op, calls[1].values.sexual_orientation, calls[1].filters], ["profiles", "update", null, [["id", PROFILE]]]);
  assert.deepEqual(audits, ["CONSENT_WITHDRAWN"]);
});

test("withdrawing desires consent deletes every desire; granting deletes nothing", async () => {
  const withdrawn = await post({ consentType: "SPECIAL_CATEGORY_DESIRES", granted: false });
  assert.equal(withdrawn.response.status, 200);
  assert.deepEqual(withdrawn.calls.slice(1).map((c) => [c.table, c.op, c.filters]), [["member_desires", "delete", [["profile_id", PROFILE]]]]);
  const granted = await post({ consentType: "SPECIAL_CATEGORY_PROFILE", granted: true });
  assert.equal(granted.response.status, 200);
  assert.deepEqual(granted.calls.map((c) => c.op), ["insert"]);
  assert.deepEqual(granted.audits, ["CONSENT_GRANTED"]);
});

test("a failed deletion is reported, unknown consents are refused, and the owner cannot be chosen", async () => {
  const failed = await post({ consentType: "SPECIAL_CATEGORY_PROFILE", granted: false }, { failErase: true });
  assert.equal(failed.response.status, 502);
  assert.equal(failed.calls[0].values.consent_status, "WITHDRAWN", "withdrawal stays recorded so the deletion can be retried");
  for (const body of [{ consentType: "PERSONALIZED_DISCOVERY", granted: true }, { consentType: "SPECIAL_CATEGORY_PROFILE", granted: "yes" }]) {
    assert.equal((await post(body)).response.status, 400);
  }
  const spoof = await post({ consentType: "SPECIAL_CATEGORY_PROFILE", granted: true, profileId: "someone-else" });
  assert.equal(spoof.calls[0].values.profile_id, PROFILE);
});

/** Runs GET with a fake database holding the given consent rows and covered data. */
async function get({ consents, profile, desires }) {
  const db = { from(table) {
    const q = new Proxy({}, { get(_, key) {
      if (key === "then") return (resolve) => resolve(
        table === "user_consents" ? { data: consents, error: null }
        : table === "profiles" ? { data: profile, error: null }
        : { data: desires, error: null });
      return () => q;
    } });
    return q;
  } };
  const route = load("src/app/api/privacy/consents/route.ts", {
    "@/lib/auth/serverActor": { resolveServerActor: async () => ({ status: "authenticated", actor: { profileId: PROFILE, userId: "user-1", role: "MEMBER" } }) },
    "@/lib/supabase/server": { getServerSupabase: () => db },
    "@/lib/security/rateLimiter": {}, "@/lib/auth/auditLogger": {}, "@/lib/auth/durableAudit": {},
    "@/lib/privacy/consents.mjs": registry,
  });
  return (await route.GET({})).json();
}

test("a withdrawn consent with data still stored is reported, so Settings can offer Delete now after a reload", async () => {
  const withdrawn = (type) => ({ consent_type: type, consent_version: CONSENTS[type].version, consent_timestamp: "2026-11-18T08:00:00Z", consent_status: "WITHDRAWN" });
  const leftover = await get({ consents: [withdrawn("SPECIAL_CATEGORY_PROFILE"), withdrawn("SPECIAL_CATEGORY_DESIRES")], profile: { sexual_orientation: "QUEER" }, desires: [{ profile_id: PROFILE }] });
  assert.deepEqual(leftover.pendingErasure, { SPECIAL_CATEGORY_PROFILE: true, SPECIAL_CATEGORY_DESIRES: true });
  const clean = await get({ consents: [withdrawn("SPECIAL_CATEGORY_PROFILE")], profile: { sexual_orientation: null }, desires: [] });
  assert.deepEqual(clean.pendingErasure, { SPECIAL_CATEGORY_PROFILE: false, SPECIAL_CATEGORY_DESIRES: false });
  // A granted consent is never flagged, whatever is stored.
  const granted = await get({ consents: [{ ...withdrawn("SPECIAL_CATEGORY_PROFILE"), consent_status: "GRANTED" }], profile: { sexual_orientation: "QUEER" }, desires: [] });
  assert.equal(granted.pendingErasure.SPECIAL_CATEGORY_PROFILE, undefined);
});

test("Settings recovers from network failures and keeps a failed deletion retryable", () => {
  const ui = read("src/components/settings/ConsentSettings.tsx");
  assert.match(ui, /try \{[\s\S]*await fetch\("\/api\/privacy\/consents", \{ method: "POST"[\s\S]*\} catch \{[\s\S]*finally \{ setBusy\(null\)/);
  assert.match(ui, /!granted && data\.pendingErasure\?\.\[type\][\s\S]*onClick=\{\(\) => void change\(type, false\)\}[\s\S]*t\("Delete now"\)/);
  // A successful reload must not wipe the error the member needs to see.
  assert.doesNotMatch(ui, /setData\(payload\); setError\(""\)/);
});
