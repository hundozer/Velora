import { spawnSync } from "node:child_process";
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("Authentication Integration TS Test Suite Runner", async () => {
  const tsTestFile = path.resolve(__dirname, "authentication.test.ts");
  
  // Run tsx tests/authentication.test.ts
  const result = spawnSync("npx", ["tsx", tsTestFile], {
    encoding: "utf8",
    env: { ...process.env }
  });
  
  if (result.status !== 0) {
    console.error("TypeScript Auth Integration Test suite failed:");
    console.error(result.stdout);
    console.error(result.stderr);
    assert.fail(`TS Integration Test suite exited with code ${result.status}`);
  } else {
    // Forward TAP stdout lines for visibility
    console.log(result.stdout);
  }
});
