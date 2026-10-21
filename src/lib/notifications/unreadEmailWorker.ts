import { createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { renderReturnEmail, unsubscribeUrl, type EmailCategory } from "./returnEmails";
import { sendQueuedEmail } from "./queuedEmail.mjs";
import { ResendClient } from "./resendClient";

export function unreadWorkerToken() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return key ? createHmac("sha256", key).update("intimo-unread-worker-v1").digest("base64url") : "";
}

export function authorizedUnreadWorker(authorization: string | null) {
  const expected = unreadWorkerToken();
  const supplied = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  return !!expected && expectedBytes.length === suppliedBytes.length && timingSafeEqual(expectedBytes, suppliedBytes);
}

export async function dispatchUnreadEmails(db: SupabaseClient) {
  const summary = { accepted: 0, skipped: 0, retry: 0 };
  const { data: jobs, error } = await db.rpc("intimo_claim_unread_emails", { p_limit: 3 });
  if (error) throw new Error("queue_claim_failed");
  for (const job of jobs || []) {
    try {
      const { data: member, error: memberError } = await db.from("profiles").select("email").eq("id", job.profile_id).single();
      if (memberError) throw new Error("recipient_lookup_failed");
      const { data: identity, error: identityError } = await db.auth.admin.getUserById(job.profile_id);
      if (identityError || !identity.user?.email_confirmed_at || identity.user.email !== member.email) throw new Error("recipient_identity_unconfirmed");
      const category = job.category as EmailCategory;
      const payload = job.payload || {
        from: ResendClient.DEFAULT_SENDER, reply_to: ResendClient.DEFAULT_REPLY_TO, to: member.email,
        subject: "You have an update on Intimo",
        html: renderReturnEmail(category, job.profile_id),
        headers: { "List-Unsubscribe": `<${unsubscribeUrl(job.profile_id, category)}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      };
      const { data: prepared, error: prepareError } = await db.rpc("intimo_prepare_unread_email", { p_id: job.id, p_lease: job.lease_id, p_payload: payload });
      if (prepareError) throw new Error("queue_prepare_failed");
      if (!prepared) { summary.skipped++; continue; }
      const receipt = await sendQueuedEmail(prepared, job.id, { apiKey: process.env.RESEND_API_KEY });
      const { data: finished, error: finishError } = await db.rpc("intimo_finish_unread_email", { p_id: job.id, p_lease: job.lease_id, p_provider_id: receipt.id });
      if (finishError || !finished) throw new Error("queue_ack_failed");
      summary.accepted++;
    } catch (cause) {
      // Never log the provider body, recipient, payload, credentials or unsubscribe URL.
      const code = cause instanceof Error && /^(provider_|queue_|recipient_)[a-z0-9_]+$/.test(cause.message) ? cause.message : "delivery_unavailable";
      const { error: retryError } = await db.rpc("intimo_finish_unread_email", { p_id: job.id, p_lease: job.lease_id, p_error: code });
      if (retryError) console.error("Unread email lease will recover", { code: "queue_retry_ack_failed" });
      summary.retry++;
    }
  }
  return summary;
}
