import { defineConfig } from "@playwright/test";

const token = process.env.E2E_VERCEL_OIDC_TOKEN;
const baseURL = process.env.E2E_BASE_URL;
if (token) {
  const url = new URL(baseURL || "");
  if (url.protocol !== "https:" || url.username || url.password || url.port || url.pathname !== "/" || url.search || url.hash ||
      !/^velora-[a-z0-9-]+-hundozers-projects\.vercel\.app$/.test(url.hostname) ||
      url.hostname === "velora-git-main-hundozers-projects.vercel.app") {
    throw new Error("Protected smoke requires a velora Preview origin in the owning Vercel team");
  }
}

export default defineConfig({
  testDir: "e2e", testMatch: "deployment-smoke.spec.ts", timeout: 120_000,
  workers: 1, retries: 0, reporter: [["list"]],
  use: {
    proxy: process.env.E2E_HTTP_PROXY ? { server: process.env.E2E_HTTP_PROXY } : undefined,
    baseURL,
    extraHTTPHeaders: token ? { "x-vercel-trusted-oidc-idp-token": token } : {},
    // Request traces can retain the short-lived protection credential.
    trace: "off",
  },
});
