import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const id = "12345678-1234-4123-8123-123456789012";
const source = readFileSync(new URL("../src/lib/privacy/retention.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;

function worker(db, send) {
  const module = { exports: {} };
  new Function("require", "module", "exports", code)((name) => name.includes("storage/r2") ? { deleteStoredObject: async () => {}, deleteVariantObjects: async () => {} } : { EmailNotificationService: { sendPrivacyDeletionComplete: send } }, module, module.exports);
  return module.exports.anonymizeDeletedProfile(db, "run", id);
}

function database({ hold = false, failCleanup = false } = {}) {
  const writes = [];
  return { writes, from(table) {
    let operation = "select", values;
    const q = new Proxy({}, { get(_, key) {
      if (key === "update" || key === "insert") return (input) => { operation = key; values = input; writes.push({ table, values }); return q; };
      if (key === "delete") return () => { operation = "delete"; return q; };
      if (key === "then") return (resolve) => {
        // Emulate the canonical database CHECK, which rejected deleted|uuid.
        const invalidIdentity = table === "profiles" && values?.auth_id && values.auth_id !== id;
        resolve({ data: table === "profiles" && operation === "select" ? { email: "fixture@example.test" } : table === "retention_holds" ? (hold ? { id: "hold" } : null) : [], error: invalidIdentity || (failCleanup && table === "member_desires") ? { code: "23514" } : null });
      };
      return () => q;
    }});
    return q;
  }};
}

test("erasure completes under the Supabase identity constraint and clears the Prague area", async () => {
  const db = database(); let notices = 0;
  const result = await worker(db, async () => { notices++; });
  assert.equal(result.status, "COMPLETED");
  const erased = db.writes.find((write) => write.table === "profiles" && write.values.account_lifecycle_status === "DELETED").values;
  assert.equal(erased.auth_id, id);
  assert.equal(erased.area_id, null);
  assert.equal(erased.discovery_disabled, true);
  assert.equal(erased.show_in_introductions, false);
  assert.equal(erased.date_of_birth, null);
  assert.equal(erased.email, `deleted+${id}@invalid.intimo.live`);
  assert.equal(notices, 1);
});

test("legal holds skip erasure and cleanup failure never claims completion", async () => {
  for (const options of [{ hold: true }, { failCleanup: true }]) {
    const db = database(options); let notices = 0;
    const result = await worker(db, async () => { notices++; });
    assert.equal(result.status, options.hold ? "SKIPPED" : "FAILED");
    assert.equal(notices, 0);
    assert.equal(db.writes.some((write) => write.values.account_lifecycle_status === "DELETED"), false);
  }
});
