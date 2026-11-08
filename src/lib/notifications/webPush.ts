import webpush from "web-push";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { isLang, translate } from "@/lib/i18n/translate";
import { pushAllowed, pushPayload, type PushCategory } from "./pushPolicy.mjs";

// Web push sender (Phase 2). Best effort and never throws: a push problem must
// never fail the action that caused it (sending a message, liking someone).

const SEND_TIMEOUT_MS = 4000;
const MIN_GAP_SECONDS = 120; // at most one push per member and category every 2 minutes
const MAX_FAILURES = 5;

export function webPushPublicKey() {
  return process.env.WEB_PUSH_VAPID_PUBLIC_KEY?.trim() || "";
}

export function webPushConfigured() {
  return Boolean(webPushPublicKey() && process.env.WEB_PUSH_VAPID_PRIVATE_KEY?.trim());
}

function vapidDetails() {
  return {
    subject: process.env.WEB_PUSH_SUBJECT?.trim() || "https://intimo.live",
    publicKey: webPushPublicKey(),
    privateKey: process.env.WEB_PUSH_VAPID_PRIVATE_KEY!.trim(),
  };
}

interface PushEvent {
  recipientId: string;
  /** The member who caused the event; no push is sent across a block. */
  actorId?: string;
  category: PushCategory;
}

export async function sendPush(event: PushEvent): Promise<{ sent: number }> {
  try {
    return await Promise.race([deliver(event), new Promise<{ sent: number }>((resolve) => setTimeout(() => resolve({ sent: 0 }), SEND_TIMEOUT_MS + 1000))]);
  } catch {
    console.error("Push delivery skipped", { code: "push_unexpected" });
    return { sent: 0 };
  }
}

async function deliver({ recipientId, actorId, category }: PushEvent) {
  if (!webPushConfigured() || recipientId === actorId) return { sent: 0 };
  const db = getServerSupabase();
  if (!db) return { sent: 0 };

  const [{ data: recipient }, { data: block }, { data: subscriptions }] = await Promise.all([
    db.from("profiles").select("account_status,is_demo,push_opt_out").eq("id", recipientId).maybeSingle(),
    actorId
      ? db.from("user_blocks").select("id").or(`and(blocker_id.eq.${recipientId},blocked_profile_id.eq.${actorId}),and(blocker_id.eq.${actorId},blocked_profile_id.eq.${recipientId})`).limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
    db.from("push_subscriptions").select("id,endpoint,p256dh,auth,locale,failure_count").eq("profile_id", recipientId).limit(10),
  ]);
  if (!recipient || recipient.account_status !== "ACTIVE" || recipient.is_demo || block) return { sent: 0 };
  if (!pushAllowed(recipient.push_opt_out, category) || !subscriptions?.length) return { sent: 0 };
  if (!(await checkRateLimit(`push:${recipientId}:${category}`, 1, MIN_GAP_SECONDS)).allowed) return { sent: 0 };

  const results = await Promise.allSettled(subscriptions.map(async (subscription) => {
    const payload = pushPayload(category, (text) => translate(isLang(subscription.locale) ? subscription.locale : "en", text));
    try {
      await webpush.sendNotification(
        { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
        JSON.stringify(payload),
        { vapidDetails: vapidDetails(), TTL: 60 * 60, urgency: category === "MESSAGE" || category === "PLAN_REPLY" ? "high" : "normal", topic: payload!.tag, timeout: SEND_TIMEOUT_MS },
      );
      await db.from("push_subscriptions").update({ last_success_at: new Date().toISOString(), failure_count: 0 }).eq("id", subscription.id);
      return true;
    } catch (cause) {
      const status = (cause as { statusCode?: number })?.statusCode;
      // 404/410: the device unsubscribed or the browser was reset; forget it.
      if (status === 404 || status === 410 || subscription.failure_count + 1 >= MAX_FAILURES) {
        await db.from("push_subscriptions").delete().eq("id", subscription.id);
      } else {
        await db.from("push_subscriptions").update({ failure_count: subscription.failure_count + 1 }).eq("id", subscription.id);
      }
      // Never log the endpoint, keys or recipient.
      console.error("Push delivery failed", { code: status ? `push_http_${status}` : "push_transport" });
      return false;
    }
  }));
  return { sent: results.filter((result) => result.status === "fulfilled" && result.value).length };
}
