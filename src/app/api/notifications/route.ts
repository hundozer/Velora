import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function actor(req: NextRequest) {
  const result = await resolveServerActor(req);
  if (result.status !== "authenticated") return { response: NextResponse.json({ error: "Authentication required" }, { status: result.status === "unauthenticated" ? 401 : 503 }) };
  if (!hasAdultAccess(result.actor)) return { response: NextResponse.json({ error: "Adult access verification required" }, { status: 403 }) };
  return { actor: result.actor };
}

export async function GET(req: NextRequest) {
  const auth = await actor(req); if ("response" in auth) return auth.response;
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Notifications unavailable" }, { status: 503 });
  const { data, error } = await db.from("notifications").select("id,type,title,message,actor_name,actor_avatar,target_link,is_read,created_at").eq("user_id", auth.actor.profileId).order("created_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: "Notifications lookup failed" }, { status: 502 });
  const notifications = (data || []).map((item) => ({ id: item.id, type: item.type, title: item.title, message: item.message, actorName: item.actor_name, actorAvatar: item.actor_avatar, targetLink: item.target_link, isRead: item.is_read, createdAt: item.created_at }));
  return NextResponse.json({ notifications, unreadCount: notifications.filter((item) => !item.isRead).length }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(req: NextRequest) {
  const auth = await actor(req); if ("response" in auth) return auth.response;
  if (!checkRateLimit(`notifications-update:${auth.actor.auth0Sub}`, 60, 60).allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  let body: unknown; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const input = body as { id?: unknown; all?: unknown };
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Notifications unavailable" }, { status: 503 });
  let query = db.from("notifications").update({ is_read: true }).eq("user_id", auth.actor.profileId);
  if (input.all !== true) {
    if (typeof input.id !== "string" || !UUID.test(input.id)) return NextResponse.json({ error: "Invalid notification" }, { status: 400 });
    query = query.eq("id", input.id);
  }
  const { error } = await query; if (error) return NextResponse.json({ error: "Notification update failed" }, { status: 502 });
  return NextResponse.json({ updated: true });
}

export async function DELETE(req: NextRequest) {
  const auth = await actor(req); if ("response" in auth) return auth.response;
  if (!checkRateLimit(`notifications-delete:${auth.actor.auth0Sub}`, 40, 60).allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const url = new URL(req.url); const id = url.searchParams.get("id"); const all = url.searchParams.get("all") === "true";
  if (!all && (!id || !UUID.test(id))) return NextResponse.json({ error: "Invalid notification" }, { status: 400 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Notifications unavailable" }, { status: 503 });
  let query = db.from("notifications").delete().eq("user_id", auth.actor.profileId); if (!all && id) query = query.eq("id", id);
  const { error } = await query; if (error) return NextResponse.json({ error: "Notification deletion failed" }, { status: 502 });
  return NextResponse.json({ deleted: true });
}
