import { createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ResendClient } from "./resendClient";

// Return triggers (P1-11): discreet emails that bring members back. Decided at
// event time: skip when the member is active now, opted out, or was emailed in
// this category in the last 3 hours. Emails never contain names or message text.

export const EMAIL_CATEGORIES = ["MESSAGE", "INTEREST", "PRIVATE_ACCESS", "PLAN_REPLY"] as const;
export type EmailCategory = (typeof EMAIL_CATEGORIES)[number];
export const EMAIL_CATEGORY_LABELS: Record<EmailCategory, string> = {
  MESSAGE: "New messages",
  INTEREST: "Interest and matches",
  PRIVATE_ACCESS: "Private photo requests",
  PLAN_REPLY: "Replies to your plans",
};
const THROTTLE_MS = 3 * 60 * 60 * 1000;
const ACTIVE_NOW_MS = 10 * 60 * 1000;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://intimo.live";

const COPY: Record<EmailCategory, { subject: string; line: string; cta: string; path: string }> = {
  MESSAGE: { subject: "You have a new message on Intimo", line: "Someone wrote to you.", cta: "Open messages", path: "/messages" },
  INTEREST: { subject: "Someone noticed you on Intimo", line: "There's new interest in your profile.", cta: "See activity", path: "/activity" },
  PRIVATE_ACCESS: { subject: "Private photos update on Intimo", line: "There's an update about private photos.", cta: "Open Intimo", path: "/me/private-photos" },
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

function render(category: EmailCategory, profileId: string) {
  const copy = COPY[category];
  return `<!doctype html><html><body style="margin:0;background:#0A0B0E;font-family:system-ui,sans-serif;color:#F5F1E8">
<div style="max-width:480px;margin:0 auto;padding:32px 24px;text-align:center">
<p style="font-family:Georgia,serif;font-size:22px;color:#D4AF37;margin:0 0 16px">Intimo</p>
<p style="font-size:16px;margin:0 0 24px">${copy.line}</p>
<a href="${BASE_URL}${copy.path}" style="display:inline-block;background:#D4AF37;color:#0A0B0E;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:999px">${copy.cta}</a>
<p style="font-size:12px;color:#8a857c;margin:32px 0 0">We never put names or messages in emails.<br><a href="${unsubscribeUrl(profileId, category)}" style="color:#8a857c">Stop these emails</a> · <a href="${unsubscribeUrl(profileId, "ALL")}" style="color:#8a857c">Stop all Intimo emails</a></p>
</div></body></html>`;
}

/** Sends a discreet return email if the rules allow it. Never throws. */
export async function maybeSendReturnEmail(db: SupabaseClient, profileId: string, category: EmailCategory) {
  try {
    const { data: member } = await db.from("profiles").select("email,account_status,last_active_at,email_opt_out").eq("id", profileId).maybeSingle();
    if (!member?.email || member.account_status !== "ACTIVE") return;
    const optOut: string[] = Array.isArray(member.email_opt_out) ? member.email_opt_out : [];
    if (optOut.includes("ALL") || optOut.includes(category)) return;
    if (member.last_active_at && Date.now() - new Date(member.last_active_at).getTime() < ACTIVE_NOW_MS) return;
    const { data: state } = await db.from("email_send_state").select("last_sent_at").eq("profile_id", profileId).eq("category", category).maybeSingle();
    if (state && Date.now() - new Date(state.last_sent_at).getTime() < THROTTLE_MS) return;
    // Claim the slot first so concurrent events can't double-send.
    const { error: claimError } = await db.from("email_send_state").upsert({ profile_id: profileId, category, last_sent_at: new Date().toISOString() }, { onConflict: "profile_id,category" });
    if (claimError) return;
    await ResendClient.sendEmail({ to: member.email, subject: COPY[category].subject, html: render(category, profileId) });
  } catch (error) {
    console.error("Return email skipped", { category, message: error instanceof Error ? error.message : "unknown" });
  }
}
