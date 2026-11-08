import { NextRequest, NextResponse } from "next/server";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { isLang } from "@/lib/i18n/translate";
import { isAllowedPushEndpoint, parsePushSubscription, PUSH_CATEGORIES } from "@/lib/notifications/pushPolicy.mjs";
import { webPushConfigured, webPushPublicKey } from "@/lib/notifications/webPush";

// Web push devices and preferences (Phase 2).
// GET: is push available + the VAPID public key + this member's opted-out categories.
// POST: register this device. DELETE: forget this device. PUT: save opted-out categories.
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };
const ALLOWED_OPT_OUT = new Set<string>([...PUSH_CATEGORIES, "ALL"]);

async function context(req: NextRequest) {
  const auth = await resolveServerActor(req);
  if (auth.status !== "authenticated") return { error: NextResponse.json({ error: "Authentication required" }, { status: auth.status === "unauthenticated" ? 401 : 503 }) };
  const db = getServerSupabase();
  if (!db) return { error: NextResponse.json({ error: "Notifications unavailable" }, { status: 503 }) };
  return { actor: auth.actor, db };
}

async function readBody(req: NextRequest): Promise<Record<string, unknown> | null> {
  try { const body = await req.json(); return body && typeof body === "object" ? body : null; } catch { return null; }
}

export async function GET(req: NextRequest) {
  const ctx = await context(req); if ("error" in ctx) return ctx.error;
  const endpoint = new URL(req.url).searchParams.get("endpoint");
  const [{ data, error }, device] = await Promise.all([
    ctx.db.from("profiles").select("push_opt_out").eq("id", ctx.actor.profileId).maybeSingle(),
    endpoint && isAllowedPushEndpoint(endpoint)
      ? ctx.db.from("push_subscriptions").select("id").eq("profile_id", ctx.actor.profileId).eq("endpoint", endpoint).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if (error) return NextResponse.json({ error: "Notification settings lookup failed" }, { status: 502 });
  return NextResponse.json({ enabled: webPushConfigured(), publicKey: webPushPublicKey() || null, optOut: data?.push_opt_out || [], thisDevice: Boolean(device.data) }, { headers: noStore });
}

export async function POST(req: NextRequest) {
  const ctx = await context(req); if ("error" in ctx) return ctx.error;
  if (!webPushConfigured()) return NextResponse.json({ error: "Notifications aren't available yet" }, { status: 503 });
  if (!(await checkRateLimit(`push-subscribe:${ctx.actor.userId}`, 10, 60 * 60)).allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const body = await readBody(req);
  const subscription = parsePushSubscription(body?.subscription);
  if (!subscription) return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  const locale = isLang(body?.locale) ? body.locale : "en";
  // A device belongs to whoever signed in on it last: re-registering moves it.
  const { error } = await ctx.db.from("push_subscriptions").upsert(
    { profile_id: ctx.actor.profileId, endpoint: subscription.endpoint, p256dh: subscription.p256dh, auth: subscription.auth, locale, failure_count: 0 },
    { onConflict: "endpoint" },
  );
  if (error) return NextResponse.json({ error: "This device could not be registered" }, { status: 502 });
  // Keep the number of devices per member small.
  const { data: devices } = await ctx.db.from("push_subscriptions").select("id").eq("profile_id", ctx.actor.profileId).order("created_at", { ascending: false });
  const stale = (devices || []).slice(10).map((device) => device.id);
  if (stale.length) await ctx.db.from("push_subscriptions").delete().in("id", stale);
  return NextResponse.json({ registered: true }, { status: 201, headers: noStore });
}

export async function DELETE(req: NextRequest) {
  const ctx = await context(req); if ("error" in ctx) return ctx.error;
  const body = await readBody(req);
  const endpoint = body?.endpoint;
  if (!isAllowedPushEndpoint(endpoint)) return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  const { error } = await ctx.db.from("push_subscriptions").delete().eq("profile_id", ctx.actor.profileId).eq("endpoint", endpoint as string);
  if (error) return NextResponse.json({ error: "This device could not be removed" }, { status: 502 });
  return NextResponse.json({ removed: true }, { headers: noStore });
}

export async function PUT(req: NextRequest) {
  const ctx = await context(req); if ("error" in ctx) return ctx.error;
  const body = await readBody(req);
  const optOut = Array.isArray(body?.optOut) ? [...new Set((body!.optOut as unknown[]).filter((value): value is string => typeof value === "string" && ALLOWED_OPT_OUT.has(value)))] : null;
  if (!optOut) return NextResponse.json({ error: "Invalid preferences" }, { status: 400 });
  const { error } = await ctx.db.from("profiles").update({ push_opt_out: optOut }).eq("id", ctx.actor.profileId);
  if (error) return NextResponse.json({ error: "Preferences could not be saved" }, { status: 502 });
  return NextResponse.json({ optOut }, { headers: noStore });
}
