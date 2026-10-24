import { createHmac, timingSafeEqual } from "node:crypto";

// Discreet templates and signed opt-out links. All return categories use the durable queue.

export const EMAIL_CATEGORIES = ["MESSAGE", "INTEREST", "PRIVATE_ACCESS", "PLAN_REPLY"] as const;
export type EmailCategory = (typeof EMAIL_CATEGORIES)[number];
export const EMAIL_CATEGORY_LABELS: Record<EmailCategory, string> = {
  MESSAGE: "New messages",
  INTEREST: "Mutual interest",
  PRIVATE_ACCESS: "Private photo requests and approvals",
  PLAN_REPLY: "Replies to your plans",
};
const BASE_URL = process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXT_PUBLIC_APP_URL || "https://intimo.live";

const COPY: Record<EmailCategory, { subject: string; line: string; cta: string; path: string }> = {
  MESSAGE: { subject: "You have a new message on Intimo", line: "Someone wrote to you.", cta: "Open messages", path: "/messages" },
  INTEREST: { subject: "Someone noticed you on Intimo", line: "You have a new mutual connection. Open Intimo to see your activity.", cta: "See activity", path: "/activity" },
  PRIVATE_ACCESS: { subject: "Private photos update on Intimo", line: "There's an update about private photos.", cta: "Open Intimo", path: "/notifications" },
  PLAN_REPLY: { subject: "Someone replied to your plan", line: "Your plan got a reply.", cta: "Open messages", path: "/messages" },
};

function linkKey() {
  // Derived from an existing server-only secret; no extra configuration needed.
  return createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY || "").update("intimo-email-links-v1").digest();
}

export function unsubscribeToken(profileId: string, category: string) {
  return createHmac("sha256", linkKey()).update(`${profileId}:${category}`).digest("base64url");
}

export function verifyUnsubscribeToken(profileId: string, category: string, token: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return false;
  const expected = Buffer.from(unsubscribeToken(profileId, category));
  const supplied = Buffer.from(token || "");
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

export function unsubscribeUrl(profileId: string, category: string) {
  const params = new URLSearchParams({ u: profileId, c: category, t: unsubscribeToken(profileId, category) });
  return `${BASE_URL}/api/email/unsubscribe?${params}`;
}

export function renderReturnEmail(category: EmailCategory, profileId: string) {
  const copy = COPY[category];
  return `<!doctype html><html><body style="margin:0;background:#191C20;font-family:system-ui,sans-serif;color:#EDF1F4">
<div style="max-width:480px;margin:0 auto;padding:32px 24px;text-align:center">
<p style="font-family:Georgia,serif;font-size:22px;color:#A8D5EF;margin:0 0 16px">Intimo</p>
<p style="font-size:16px;margin:0 0 24px">${copy.line}</p>
<a href="${BASE_URL}${copy.path}" style="display:inline-block;background:#A8D5EF;color:#191C20;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:999px">${copy.cta}</a>
<p style="font-size:12px;color:#AAB7C3;margin:32px 0 0">We never put names or messages in emails.<br><a href="${unsubscribeUrl(profileId, category)}" style="color:#AAB7C3">Stop these emails</a> · <a href="${unsubscribeUrl(profileId, "ALL")}" style="color:#AAB7C3">Stop all Intimo emails</a></p>
</div></body></html>`;
}
