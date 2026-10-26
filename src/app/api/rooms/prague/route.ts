import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { appendDurableAudit } from "@/lib/auth/durableAudit";

export const dynamic = "force-dynamic";
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

async function access(req: NextRequest) {
  const result = await resolveServerActor(req);
  if (result.status !== "authenticated") return { error: reply({ error: "Sign in to enter the room" }, result.status === "unauthenticated" ? 401 : 503) };
  if (!hasAdultAccess(result.actor)) return { error: reply({ error: "Active adult account required" }, 403) };
  const db = getServerSupabase();
  return db ? { actor: result.actor, db } : { error: reply({ error: "Room unavailable" }, 503) };
}

export async function GET(req: NextRequest) {
  const auth = await access(req); if ("error" in auth) return auth.error;
  const { db, actor } = auth;
  const since = new Date(Date.now() - 7 * 86400_000).toISOString();
  const [messages, blocks] = await Promise.all([
    db.from("room_messages").select("id,sender_id,body,created_at").eq("room_id", "prague").eq("status", "VISIBLE").gte("created_at", since).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(100),
    db.from("user_blocks").select("blocker_id,blocked_profile_id").or(`blocker_id.eq.${actor.profileId},blocked_profile_id.eq.${actor.profileId}`),
  ]);
  if (messages.error || blocks.error) return reply({ error: "Room unavailable" }, 502);
  const hidden = new Set((blocks.data || []).map(b => b.blocker_id === actor.profileId ? b.blocked_profile_id : b.blocker_id));
  const ids = [...new Set((messages.data || []).map(m => m.sender_id).filter(id => !hidden.has(id)))];
  const profiles = ids.length ? await db.from("profiles").select("id,display_name,account_status,auth_id,is_demo").in("id", ids) : { data: [], error: null };
  if (profiles.error) return reply({ error: "Room unavailable" }, 502);
  const byId = new Map((profiles.data || []).filter(p => p.account_status === "ACTIVE" && p.auth_id && !p.is_demo).map(p => [p.id, p.display_name]));
  return reply({ messages: (messages.data || []).filter(m => byId.has(m.sender_id)).reverse().map(m => ({ id: m.id, senderId: m.sender_id, senderName: byId.get(m.sender_id), body: m.body, createdAt: m.created_at })) });
}

export async function POST(req: NextRequest) {
  const auth = await access(req); if ("error" in auth) return auth.error;
  const { db, actor } = auth;
  if (Number(req.headers.get("content-length") || 0) > 2048) return reply({ error: "Message too large" }, 413);
  if (!(await checkRateLimit(`room-prague:${actor.userId}`, 10, 60)).allowed) return reply({ error: "Slow down a moment" }, 429);
  let input: unknown; try { input = await req.json(); } catch { return reply({ error: "Invalid message" }, 400); }
  const body = typeof input === "object" && input !== null && "body" in input && typeof input.body === "string" ? input.body.trim() : "";
  if (!body || body.length > 500) return reply({ error: "Write 1–500 characters" }, 400);
  const profile = await db.from("profiles").select("id").eq("id", actor.profileId).eq("is_demo", false).maybeSingle();
  if (profile.error) return reply({ error: "Room unavailable" }, 502);
  if (!profile.data) return reply({ error: "Active member required" }, 403);
  const { data, error } = await db.from("room_messages").insert({ room_id: "prague", sender_id: actor.profileId, body }).select("id").single();
  if (error || !data) return reply({ error: "Message could not be posted" }, 502);
  await appendDurableAudit(db, { actorProfileId: actor.profileId, actorUserId: actor.userId, action: "ROOM_MESSAGE_POST", resourceType: "ROOM_MESSAGE", resourceId: data.id, outcome: "SUCCESS" });
  return reply({ id: data.id }, 201);
}

export async function DELETE(req: NextRequest) {
  const auth = await access(req); if ("error" in auth) return auth.error;
  const id = req.nextUrl.searchParams.get("id") || "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return reply({ error: "Invalid message" }, 400);
  const { data, error } = await auth.db.from("room_messages").update({ status: "REMOVED" }).eq("id", id).eq("sender_id", auth.actor.profileId).eq("status", "VISIBLE").select("id").maybeSingle();
  if (error) return reply({ error: "Removal unavailable" }, 502);
  if (!data) return reply({ error: "Message unavailable" }, 404);
  await appendDurableAudit(auth.db, { actorProfileId: auth.actor.profileId, actorUserId: auth.actor.userId, action: "ROOM_MESSAGE_REMOVE", resourceType: "ROOM_MESSAGE", resourceId: id, outcome: "SUCCESS" });
  return reply({ removed: true });
}
