/** Fail closed before credentials are sent. A bare base_url input is not trusted. */
export function memberEnvironment() {
  const names = ["E2E_BASE_URL", "E2E_ALLOWED_ORIGIN", "E2E_A_EMAIL", "E2E_A_PASSWORD", "E2E_B_EMAIL", "E2E_B_PASSWORD", "E2E_A_PRIVATE_MEDIA_ID"] as const;
  const missing = names.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Member acceptance is not configured: ${missing.join(", ")}`);
  const url = new URL(process.env.E2E_BASE_URL!);
  const allowed = new URL(process.env.E2E_ALLOWED_ORIGIN!);
  const production = new Set(["intimo.live", "www.intimo.live", "velora-six-ashen.vercel.app", "velora-hundozers-projects.vercel.app", "velora-git-main-hundozers-projects.vercel.app", "velora-o2cjgkabf-hundozers-projects.vercel.app"]);
  if (url.protocol !== "https:" || url.username || url.password || url.origin !== allowed.origin || production.has(url.hostname) || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("Member acceptance requires an explicitly allowlisted non-production HTTPS origin.");
  }
  if (process.env.E2E_A_EMAIL === process.env.E2E_B_EMAIL) throw new Error("Use two distinct dedicated test members.");
}
