import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { appendDurableAudit } from "@/lib/auth/durableAudit";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIONS = new Set(["REQUEST", "ACCEPT", "DECLINE", "REMOVE"]);

export async function GET(req: NextRequest) {
  const auth = await resolveServerActor(req);
  if (auth.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: auth.status === "unauthenticated" ? 401 : 503 });
  const targetId = new URL(req.url).searchParams.get("targetProfileId") || "";
  if (!UUID.test(targetId) || targetId === auth.actor.profileId) return NextResponse.json({ error: "Invalid friend target" }, { status: 400 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Friends unavailable" }, { status: 503 });
  const { data, error } = await db.from("friendships").select("requester_id,addressee_id,status")
    .or(`and(requester_id.eq.${auth.actor.profileId},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${auth.actor.profileId})`).limit(1).maybeSingle();
  if (error) return NextResponse.json({ error: "Friend status unavailable" }, { status: 502 });
  const status = !data ? "NONE" : data.status === "ACCEPTED" ? "FRIENDS" : data.requester_id === auth.actor.profileId ? "OUTGOING" : "INCOMING";
  return NextResponse.json({ status }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: NextRequest) {
  const auth = await resolveServerActor(req);
  if (auth.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: auth.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(auth.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  const rate = checkRateLimit(`friend:${auth.actor.auth0Sub}`, 40, 60 * 60); if (!rate.allowed) return NextResponse.json({ error: "Too many friend actions" }, { status: 429 });
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const targetId = typeof body.targetProfileId === "string" ? body.targetProfileId : "";
  const action = typeof body.action === "string" ? body.action : "";
  if (!UUID.test(targetId) || targetId === auth.actor.profileId || !ACTIONS.has(action)) return NextResponse.json({ error: "Invalid friend action" }, { status: 400 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Friends unavailable" }, { status: 503 });
  const { data: target } = await db.from("profiles").select("id,display_name,account_status").eq("id", targetId).maybeSingle();
  if (!target || target.account_status !== "ACTIVE") return NextResponse.json({ error: "Member unavailable" }, { status: 404 });
  const { data, error } = await db.rpc("intimo_friend_action", { p_actor_id: auth.actor.profileId, p_target_id: targetId, p_action: action });
  if (error) return NextResponse.json({ error: "Friend action unavailable" }, { status: 409 });
  const audited = await appendDurableAudit(db, { actorProfileId: auth.actor.profileId, actorAuth0Sub: auth.actor.auth0Sub, action: `FRIEND_${action}`, resourceType: "PROFILE", resourceId: targetId, outcome: "SUCCESS" });
  if (!audited) return NextResponse.json({ error: "Friend action applied but audit recording failed; contact support" }, { status: 503 });
  if ((action === "REQUEST" && data === "OUTGOING") || (action === "ACCEPT" && data === "FRIENDS")) {
    const { data: actorProfile } = await db.from("profiles").select("display_name,avatar_url").eq("id", auth.actor.profileId).maybeSingle();
    if (actorProfile) await db.from("notifications").insert({
      user_id: targetId,
      type: action === "ACCEPT" ? "FRIEND_ACCEPTED" : "FRIEND_REQUEST",
      title: action === "ACCEPT" ? "Friend request accepted" : "New friend request",
      message: action === "ACCEPT" ? `${actorProfile.display_name} accepted your friend request.` : `${actorProfile.display_name} wants to be friends.`,
      actor_name: actorProfile.display_name,
      actor_avatar: actorProfile.avatar_url,
      target_link: `/profile/${auth.actor.profileId}`,
      is_read: false,
    });
  }
  return NextResponse.json({ status: data });
}
