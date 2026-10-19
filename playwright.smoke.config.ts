import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "e2e", testMatch: "deployment-smoke.spec.ts", timeout: 45_000,
  workers: 1, retries: 0, reporter: [["list"]],
  use: { proxy: process.env.E2E_HTTP_PROXY ? { server: process.env.E2E_HTTP_PROXY } : undefined, baseURL: process.env.E2E_BASE_URL, trace: "retain-on-failure" },
});
