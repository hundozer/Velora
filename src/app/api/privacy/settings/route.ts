import { NextRequest, NextResponse } from "next/server";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { auditLogger } from "@/lib/auth/auditLogger";
import { appendDurableAudit } from "@/lib/auth/durableAudit";

export const dynamic = "force-dynamic";
const COLUMNS = "profile_visibility,sensitive_fields_visibility,location_precision,show_online_status,show_distance,message_permission,browse_invisibly,show_in_introductions";
const LEGACY_COLUMNS = "profile_visibility,sensitive_fields_visibility,location_precision,show_online_status,show_distance,message_permission,browse_invisibly";
const UNDEFINED_COLUMN = "42703";
const VISIBILITY = new Set(["EVERYONE", "MEMBERS_ONLY", "FRIENDS_ONLY", "PRIVATE"]);
const MESSAGE_PERMISSION = new Set(["EVERYONE", "MEMBERS_ONLY", "FRIENDS_ONLY", "PRIVATE"]);

export async function GET(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Privacy service unavailable" }, { status: 503 });
  let { data, error } = await supabase.from("profiles").select(COLUMNS).eq("id", actor.actor.profileId).single();
  // Before the 20261103 migration there is no Introductions opt-out column yet.
  if (error?.code === UNDEFINED_COLUMN) ({ data, error } = await supabase.from("profiles").select(LEGACY_COLUMNS).eq("id", actor.actor.profileId).single());
  if (error) return NextResponse.json({ error: "Privacy settings lookup failed" }, { status: 502 });
  return NextResponse.json({ settings: data }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PUT(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  const rate = (await checkRateLimit(`privacy-settings:${actor.actor.userId}`, 30, 60 * 60));
  if (!rate.allowed) return NextResponse.json({ error: "Too many settings changes" }, { status: 429 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const input = body as Record<string, unknown>;
  if (!VISIBILITY.has(String(input.profileVisibility)) || !VISIBILITY.has(String(input.sensitiveFieldsVisibility)) || !MESSAGE_PERMISSION.has(String(input.messagePermission))) return NextResponse.json({ error: "Invalid privacy setting" }, { status: 400 });
  if (!new Set(["HIDDEN", "CITY", "APPROXIMATE_DISTANCE"]).has(String(input.locationPrecision))) return NextResponse.json({ error: "Invalid location precision" }, { status: 400 });
  const update = {
    profile_visibility: input.profileVisibility,
    public_profile_visibility: input.profileVisibility === "EVERYONE",
    sensitive_fields_visibility: input.sensitiveFieldsVisibility,
    location_precision: input.locationPrecision,
    show_online_status: input.showOnlineStatus === true,
    browse_invisibly: input.browseInvisibly === true,
    // Older clients don't send this; only an explicit false takes a member out of Introductions.
    show_in_introductions: input.showInIntroductions !== false,
    show_distance: input.showDistance === true && input.locationPrecision !== "HIDDEN",
    message_permission: input.messagePermission,
    updated_at: new Date().toISOString(),
  };
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Privacy service unavailable" }, { status: 503 });
  let { data, error } = await supabase.from("profiles").update(update).eq("id", actor.actor.profileId).select(COLUMNS).single();
  if (error?.code === UNDEFINED_COLUMN) {
    const { show_in_introductions: _unavailable, ...legacy } = update;
    ({ data, error } = await supabase.from("profiles").update(legacy).eq("id", actor.actor.profileId).select(LEGACY_COLUMNS).single());
  }
  if (error) return NextResponse.json({ error: "Privacy settings update failed" }, { status: 502 });
  auditLogger.logEvent({ actorId: actor.actor.userId, actorRole: actor.actor.role as any, action: "PRIVACY_SETTINGS_UPDATE", resourceId: actor.actor.profileId, resourceType: "PROFILE", status: "SUCCESS" });
  const audited = await appendDurableAudit(supabase, { actorProfileId: actor.actor.profileId, actorUserId: actor.actor.userId, action: "PRIVACY_SETTINGS_UPDATE", resourceType: "PROFILE", resourceId: actor.actor.profileId, outcome: "SUCCESS" });
  if (!audited) return NextResponse.json({ error: "Settings saved but audit evidence failed; contact support" }, { status: 502 });
  return NextResponse.json({ settings: data }, { headers: { "Cache-Control": "private, no-store" } });
}
