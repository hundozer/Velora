import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const source = readFileSync(new URL("../e2e/member-environment.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
function validate(env) {
  const module = { exports: {} };
  new Function("module", "exports", "process", code)(module, module.exports, { env });
  return module.exports.memberEnvironment();
}
const fixture = { E2E_BASE_URL: "https://isolated.example.test", E2E_ALLOWED_ORIGIN: "https://isolated.example.test", E2E_A_EMAIL: "a@example.test", E2E_A_PASSWORD: "fixture-only", E2E_B_EMAIL: "b@example.test", E2E_B_PASSWORD: "fixture-only", E2E_A_PRIVATE_MEDIA_ID: "fixture" };
test("acceptance refuses missing fixtures rather than recording a skipped success", () => {
  assert.throws(() => validate({}), /not configured/);
  assert.doesNotThrow(() => validate(fixture));
});
test("acceptance refuses production, non-HTTPS, credentials in URLs and unallowlisted origins", () => {
  for (const url of ["https://intimo.live", "https://velora-git-main-hundozers-projects.vercel.app", "http://isolated.example.test", "https://name:password@isolated.example.test", "https://isolated.example.test/redirect"]) {
    assert.throws(() => validate({ ...fixture, E2E_BASE_URL: url, E2E_ALLOWED_ORIGIN: new URL(url).origin }));
  }
  assert.throws(() => validate({ ...fixture, E2E_BASE_URL: "https://untrusted.example.test" }));
  assert.throws(() => validate({ ...fixture, E2E_B_EMAIL: fixture.E2E_A_EMAIL }));
});
