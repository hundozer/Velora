import { defineConfig } from "@playwright/test";

// Full-loop E2E (P1-17). Runs against a deployed environment with two test
// members; never point E2E_BASE_URL at production. See e2e/README.md.
export default defineConfig({
  testDir: "e2e",
  testIgnore: "deployment-smoke.spec.ts",
  projects: [
    { name: "ui", testIgnore: "full-loop.spec.ts" },
    { name: "member-acceptance", testMatch: "full-loop.spec.ts" },
  ],
  timeout: 120_000,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL,
    trace: "retain-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
  },
});
