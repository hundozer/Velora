import { NextRequest, NextResponse } from "next/server";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { auditLogger } from "@/lib/auth/auditLogger";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Blocking service unavailable" }, { status: 503 });
  const { data, error } = await supabase.from("user_blocks").select("id,blocked_profile_id,created_at,profiles!user_blocks_blocked_profile_id_fkey(display_name,avatar_url)").eq("blocker_id", actor.actor.profileId).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Blocked users lookup failed" }, { status: 502 });
  return NextResponse.json({ blocks: data || [] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  const rate = checkRateLimit(`block:${actor.actor.auth0Sub}`, 40, 60 * 60);
  if (!rate.allowed) return NextResponse.json({ error: "Too many block changes" }, { status: 429 });
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const targetProfileId = typeof body.targetProfileId === "string" ? body.targetProfileId : "";
  if (!UUID.test(targetProfileId) || targetProfileId === actor.actor.profileId) return NextResponse.json({ error: "Invalid block target" }, { status: 400 });
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Blocking service unavailable" }, { status: 503 });
  const { error } = await supabase.from("user_blocks").upsert({ blocker_id: actor.actor.profileId, blocked_profile_id: targetProfileId }, { onConflict: "blocker_id,blocked_profile_id" });
  if (error) return NextResponse.json({ error: "User could not be blocked" }, { status: 502 });
  auditLogger.logEvent({ actorId: actor.actor.auth0Sub, actorRole: actor.actor.role as any, action: "USER_BLOCK", resourceId: targetProfileId, resourceType: "PROFILE", status: "SUCCESS" });
  return NextResponse.json({ blocked: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  const targetProfileId = new URL(req.url).searchParams.get("targetProfileId") || "";
  if (!UUID.test(targetProfileId)) return NextResponse.json({ error: "Invalid block target" }, { status: 400 });
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Blocking service unavailable" }, { status: 503 });
  const { error } = await supabase.from("user_blocks").delete().eq("blocker_id", actor.actor.profileId).eq("blocked_profile_id", targetProfileId);
  if (error) return NextResponse.json({ error: "User could not be unblocked" }, { status: 502 });
  auditLogger.logEvent({ actorId: actor.actor.auth0Sub, actorRole: actor.actor.role as any, action: "USER_UNBLOCK", resourceId: targetProfileId, resourceType: "PROFILE", status: "SUCCESS" });
  return NextResponse.json({ blocked: false });
}
