import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("../playwright.smoke.config.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
function config(env) {
  const exports = {};
  new Function("exports", "require", "process", code)(exports, () => ({ defineConfig: (value) => value }), { env });
  return exports.default;
}
const preview = "https://velora-preview123-hundozers-projects.vercel.app";
const fixtureToken = "synthetic-token-not-a-credential";
test("protected smoke scopes its identity header to the project and disables traces", () => {
  const result = config({ E2E_BASE_URL: preview, E2E_VERCEL_OIDC_TOKEN: fixtureToken });
  assert.equal(result.use.extraHTTPHeaders["x-vercel-trusted-oidc-idp-token"], fixtureToken);
  assert.equal(result.use.trace, "off");
});
test("protected smoke refuses unexpected destinations before creating a request context", () => {
  for (const url of [undefined, "https://intimo.live", "https://velora-git-main-hundozers-projects.vercel.app", "https://other.example", `${preview}.evil.test`, preview.replace("https:", "http:"), `${preview}:8443`, `${preview}/redirect`, `${preview}?target=elsewhere`, `${preview}#fragment`, preview.replace("https://", "https://user:password@")]) {
    assert.throws(() => config({ E2E_BASE_URL: url, E2E_VERCEL_OIDC_TOKEN: fixtureToken }));
  }
});
test("public smoke sends no protection credential", () => {
  assert.deepEqual(config({ E2E_BASE_URL: "https://intimo.live" }).use.extraHTTPHeaders, {});
});
