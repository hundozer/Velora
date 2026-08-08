import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { auditLogger } from "@/lib/auth/auditLogger";
import { toMemberVisibleProfile } from "@/lib/supabase/publicProfile";
import type { ProfileRow } from "@/lib/supabase/profileService";

export const dynamic = "force-dynamic";
const TYPES = new Set(["follow", "favorite"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  const type = new URL(req.url).searchParams.get("type") || "favorite";
  if (!TYPES.has(type)) return NextResponse.json({ error: "Invalid connection type" }, { status: 400 });
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Connections unavailable" }, { status: 503 });
  const { data, error } = await supabase.from("connections").select("id,followed_id,connection_type,created_at,profiles!connections_followed_id_fkey(*)").eq("follower_id", actor.actor.profileId).eq("connection_type", type).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Connections lookup failed" }, { status: 502 });
  const connections = (data || []).map((item: any) => ({ id: item.id, followed_id: item.followed_id, connection_type: item.connection_type, created_at: item.created_at, profile: item.profiles ? toMemberVisibleProfile(item.profiles as ProfileRow) : null }));
  return NextResponse.json({ connections }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  const rate = checkRateLimit(`connection:${actor.actor.auth0Sub}`, 60, 60 * 60);
  if (!rate.allowed) return NextResponse.json({ error: "Too many connection changes" }, { status: 429 });
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const targetProfileId = typeof body.targetProfileId === "string" ? body.targetProfileId : "";
  const type = typeof body.type === "string" ? body.type : "";
  if (!UUID.test(targetProfileId) || targetProfileId === actor.actor.profileId || !TYPES.has(type)) return NextResponse.json({ error: "Invalid connection" }, { status: 400 });
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Connections unavailable" }, { status: 503 });
  const { data: block } = await supabase.from("user_blocks").select("id").or(`and(blocker_id.eq.${actor.actor.profileId},blocked_profile_id.eq.${targetProfileId}),and(blocker_id.eq.${targetProfileId},blocked_profile_id.eq.${actor.actor.profileId})`).limit(1).maybeSingle();
  if (block) return NextResponse.json({ error: "Connection unavailable" }, { status: 403 });
  const { error } = await supabase.from("connections").upsert({ follower_id: actor.actor.profileId, followed_id: targetProfileId, connection_type: type }, { onConflict: "follower_id,followed_id,connection_type" });
  if (error) return NextResponse.json({ error: "Connection failed" }, { status: 502 });
  const { data: sourceProfile } = await supabase.from("profiles").select("display_name,avatar_url").eq("id", actor.actor.profileId).maybeSingle();
  if (sourceProfile) await supabase.from("notifications").insert({ user_id: targetProfileId, type: type === "follow" ? "NEW_FOLLOWER" : "FAVORITED", title: type === "follow" ? "New follower" : "Profile saved", message: `${sourceProfile.display_name} ${type === "follow" ? "followed" : "saved"} your profile.`, actor_name: sourceProfile.display_name, actor_avatar: sourceProfile.avatar_url, target_link: `/profile/${actor.actor.profileId}`, is_read: false });
  auditLogger.logEvent({ actorId: actor.actor.auth0Sub, actorRole: actor.actor.role as any, action: type === "follow" ? "PROFILE_FOLLOW" : "PROFILE_FAVORITE", resourceId: targetProfileId, resourceType: "PROFILE", status: "SUCCESS" });
  return NextResponse.json({ connected: true, type }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  const url = new URL(req.url);
  const targetProfileId = url.searchParams.get("targetProfileId") || "";
  const type = url.searchParams.get("type") || "";
  if (!UUID.test(targetProfileId) || !TYPES.has(type)) return NextResponse.json({ error: "Invalid connection" }, { status: 400 });
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Connections unavailable" }, { status: 503 });
  const { error } = await supabase.from("connections").delete().eq("follower_id", actor.actor.profileId).eq("followed_id", targetProfileId).eq("connection_type", type);
  if (error) return NextResponse.json({ error: "Connection removal failed" }, { status: 502 });
  return NextResponse.json({ connected: false, type });
}
