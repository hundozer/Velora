import type { BrowserContext } from '@playwright/test';

/** Establish the temporary Vercel access cookie only on the independently allowed origin. */
export async function authorizePreview(context: BrowserContext) {
  const raw = process.env.E2E_VERCEL_SHARE_URL;
  if (!raw) return;
  const url = new URL(raw);
  if (url.protocol !== 'https:' || url.origin !== process.env.E2E_ALLOWED_ORIGIN || !url.searchParams.has('_vercel_share')) {
    throw new Error('Preview access link must match the allowlisted test origin');
  }
  const response = await context.request.get(raw);
  if (!response.ok()) throw new Error(`Preview authorization failed (${response.status()})`);
}
