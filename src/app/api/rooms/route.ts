import { NextRequest } from "next/server";
import { roomActor, roomReply as reply } from "@/lib/rooms/access";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { appendDurableAudit } from "@/lib/auth/durableAudit";
import { presentRoom } from "@/lib/rooms/presentation";

export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const auth = await roomActor(req); if ("error" in auth) return auth.error;
  const { data, error } = await auth.db.from("rooms").select("id,title,description,creator_id,builtin,locked,created_at,expires_at").or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`).order("builtin", { ascending: false }).order("created_at", { ascending: false }).limit(100);
  return error ? reply({ error: "Rooms unavailable" }, 502) : reply({ rooms: (data || []).map(presentRoom) });
}

export async function POST(req: NextRequest) {
  const auth = await roomActor(req); if ("error" in auth) return auth.error;
  if (!(await checkRateLimit(`create-room:${auth.actor.userId}`, 3, 3600)).allowed) return reply({ error: "Room creation limit reached" }, 429);
  if (Number(req.headers.get("content-length") || 0) > 2048) return reply({ error: "Request too large" }, 413);
  let input: Record<string, unknown>; try { input = await req.json(); } catch { return reply({ error: "Invalid room" }, 400); }
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const description = typeof input.description === "string" ? input.description.trim() : "";
  if (title.length < 3 || title.length > 80 || description.length < 1 || description.length > 500 || !["30", "forever"].includes(String(input.lifetime))) return reply({ error: "Title, description and lifetime required" }, 400);
  const profile = await auth.db.from("profiles").select("id").eq("id", auth.actor.profileId).eq("is_demo", false).maybeSingle();
  if (profile.error) return reply({ error: "Rooms unavailable" }, 502);
  if (!profile.data) return reply({ error: "Member account required" }, 403);
  const id = crypto.randomUUID();
  const createdAt = new Date();
  const { error } = await auth.db.from("rooms").insert({ id, title, description, creator_id: auth.actor.profileId, created_at: createdAt.toISOString(), expires_at: input.lifetime === "30" ? new Date(createdAt.getTime() + 30 * 86400_000).toISOString() : null });
  if (error) return reply({ error: "Room could not be created" }, 502);
  await appendDurableAudit(auth.db, { actorProfileId: auth.actor.profileId, actorUserId: auth.actor.userId, action: "ROOM_CREATE", resourceType: "ROOM", resourceId: id, outcome: "SUCCESS" });
  return reply({ id }, 201);
}
