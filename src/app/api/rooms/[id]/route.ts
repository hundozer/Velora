import { NextRequest, NextResponse } from "next/server";
import { roomAccess, roomReply as reply } from "@/lib/rooms/access";

import { checkRateLimit } from "@/lib/security/rateLimiter";
import { appendDurableAudit } from "@/lib/auth/durableAudit";

export const dynamic = "force-dynamic";
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await roomAccess(req, params.id); if ("error" in auth) return auth.error;
  const { db, actor } = auth;
  const since = new Date(Date.now() - 7 * 86400_000).toISOString();
  const [messages, blocks] = await Promise.all([
    db.from("room_messages").select("id,sender_id,body,created_at").eq("room_id", params.id).eq("status", "VISIBLE").gte("created_at", since).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(100),
    db.from("user_blocks").select("blocker_id,blocked_profile_id").or(`blocker_id.eq.${actor.profileId},blocked_profile_id.eq.${actor.profileId}`),
  ]);
  if (messages.error || blocks.error) return reply({ error: "Room unavailable" }, 502);
  const hidden = new Set((blocks.data || []).map(b => b.blocker_id === actor.profileId ? b.blocked_profile_id : b.blocker_id));
  const ids = [...new Set((messages.data || []).map(m => m.sender_id).filter(id => !hidden.has(id)))];
  const profiles = ids.length ? await db.from("profiles").select("id,username,display_name,account_status,auth_id,is_demo").in("id", ids) : { data: [], error: null };
  if (profiles.error) return reply({ error: "Room unavailable" }, 502);
  const byId = new Map((profiles.data || []).filter(p => p.account_status === "ACTIVE" && p.auth_id && !p.is_demo).map(p => [p.id, p.username || p.display_name]));
  return reply({ room: auth.room, messages: (messages.data || []).filter(m => byId.has(m.sender_id)).reverse().map(m => ({ id: m.id, senderId: m.sender_id, senderName: byId.get(m.sender_id), body: m.body, createdAt: m.created_at })) });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await roomAccess(req, params.id); if ("error" in auth) return auth.error;
  const { db, actor } = auth;
  if (Number(req.headers.get("content-length") || 0) > 2048) return reply({ error: "Message too large" }, 413);
  if (!(await checkRateLimit(`room:${params.id}:${actor.userId}`, 10, 60)).allowed) return reply({ error: "Slow down a moment" }, 429);
  let input: unknown; try { input = await req.json(); } catch { return reply({ error: "Invalid message" }, 400); }
  const body = typeof input === "object" && input !== null && "body" in input && typeof input.body === "string" ? input.body.trim() : "";
  if (!body || body.length > 500) return reply({ error: "Write 1–500 characters" }, 400);
  const profile = await db.from("profiles").select("id").eq("id", actor.profileId).eq("is_demo", false).maybeSingle();
  if (profile.error) return reply({ error: "Room unavailable" }, 502);
  if (!profile.data) return reply({ error: "Active member required" }, 403);
  const { data, error } = await db.from("room_messages").insert({ room_id: params.id, sender_id: actor.profileId, body }).select("id").single();
  if (error || !data) return reply({ error: "Message could not be posted" }, 502);
  await appendDurableAudit(db, { actorProfileId: actor.profileId, actorUserId: actor.userId, action: "ROOM_MESSAGE_POST", resourceType: "ROOM_MESSAGE", resourceId: data.id, outcome: "SUCCESS" });
  return reply({ id: data.id }, 201);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await roomAccess(req, params.id); if ("error" in auth) return auth.error;
  const id = req.nextUrl.searchParams.get("id") || "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return reply({ error: "Invalid message" }, 400);
  const moderator = auth.admin || auth.room.creator_id === auth.actor.profileId;
  let update = auth.db.from("room_messages").update({ status: "REMOVED" }).eq("id", id).eq("room_id", params.id).eq("status", "VISIBLE");
  if (!moderator) update = update.eq("sender_id", auth.actor.profileId);
  const { data, error } = await update.select("id").maybeSingle();
  if (error) return reply({ error: "Removal unavailable" }, 502);
  if (!data) return reply({ error: "Message unavailable" }, 404);
  await appendDurableAudit(auth.db, { actorProfileId: auth.actor.profileId, actorUserId: auth.actor.userId, action: moderator ? "ROOM_MESSAGE_MODERATE" : "ROOM_MESSAGE_REMOVE", resourceType: "ROOM_MESSAGE", resourceId: id, outcome: "SUCCESS", metadata: { roomId: params.id } });
  return reply({ removed: true });
}
