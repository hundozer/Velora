import { NextRequest } from "next/server";
import { roomActor, roomReply as reply } from "@/lib/rooms/access";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { appendDurableAudit } from "@/lib/auth/durableAudit";

export const dynamic = "force-dynamic";
const ROOM_ID = /^[a-z0-9-]{1,64}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIONS = new Set(["REQUEST", "CANCEL", "APPROVE", "DECLINE"]);

async function context(req: NextRequest, id: string) {
  const auth = await roomActor(req);
  if ("error" in auth) return { error: auth.error };
  if (!ROOM_ID.test(id)) return { error: reply({ error: "Room unavailable" }, 404) };
  const { data: room, error } = await auth.db.from("rooms")
    .select("id,title,description,creator_id,builtin,locked,expires_at")
    .eq("id", id).maybeSingle();
  if (error) return { error: reply({ error: "Room unavailable" }, 502) };
  if (!room || (room.expires_at && Date.parse(room.expires_at) <= Date.now()))
    return { error: reply({ error: "Room unavailable" }, 404) };
  if (room.builtin) return { error: reply({ error: "Room requests unavailable" }, 404) };
  return { ...auth, room };
}

// A pending request is NOT room access: this endpoint never reads messages or
// private presence. Room details shown here are already visible in the directory.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await context(req, params.id);
  if ("error" in auth) return auth.error;
  const me = auth.actor.profileId;
  const owner = auth.room.creator_id === me;
  const ownRequest = owner
    ? Promise.resolve({ data: null, error: null })
    : auth.db.from("room_join_requests").select("status,decided_at").eq("room_id", params.id).eq("requester_id", me).maybeSingle();
  const membership = owner
    ? Promise.resolve({ data: { profile_id: me }, error: null })
    : auth.db.from("room_members").select("profile_id").eq("room_id", params.id).eq("profile_id", me).maybeSingle();
  const [request, member] = await Promise.all([ownRequest, membership]);
  if (request.error || member.error) return reply({ error: "Room request unavailable" }, 502);
  const response: Record<string, unknown> = {
    room: auth.room,
    isOwner: owner,
    isMember: !!member.data,
    status: member.data ? "MEMBER" : request.data?.status === "APPROVED" ? "NONE" : request.data?.status || "NONE",
    retryAfter: !member.data && request.data?.status === "CANCELLED" && request.data.decided_at
      ? new Date(new Date(request.data.decided_at).getTime() + 24 * 3600_000).toISOString() : null,
  };
  if (owner) {
    const { data: pending, error } = await auth.db.from("room_join_requests")
      .select("requester_id,requested_at").eq("room_id", params.id).eq("status", "PENDING")
      .order("requested_at", { ascending: true }).limit(100);
    if (error) return reply({ error: "Room requests unavailable" }, 502);
    const ids = (pending || []).map(row => row.requester_id);
    const { data: profiles, error: profileError } = ids.length
      ? await auth.db.from("profiles").select("id,username,display_name,account_status,age_verification_status")
        .in("id", ids)
      : { data: [], error: null };
    if (profileError) return reply({ error: "Room requests unavailable" }, 502);
    const names = new Map((profiles || []).filter(p =>
      p.account_status === "ACTIVE" && p.age_verification_status === "AGE_VERIFIED"
    ).map(p => [p.id, p.username || p.display_name || "Member"]));
    response.pending = (pending || []).filter(row => names.has(row.requester_id)).map(row => ({
      requesterId: row.requester_id,
      name: names.get(row.requester_id),
      requestedAt: row.requested_at,
    }));
  }
  return reply(response);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await context(req, params.id);
  if ("error" in auth) return auth.error;
  if (!auth.room.locked) return reply({ error: "This room is open to everyone" }, 409);
  if (!(await checkRateLimit(`room-join:${auth.actor.userId}`, 12, 3600)).allowed)
    return reply({ error: "Too many room requests" }, 429);
  if (Number(req.headers.get("content-length") || 0) > 512)
    return reply({ error: "Request too large" }, 413);
  let payload: Record<string, unknown>;
  try { payload = await req.json(); } catch { return reply({ error: "Invalid request" }, 400); }
  const action = payload.action;
  const requesterId = typeof payload.requesterId === "string" ? payload.requesterId : null;
  if (typeof action !== "string" || !ACTIONS.has(action))
    return reply({ error: "Invalid action" }, 400);
  const ownerAction = action === "APPROVE" || action === "DECLINE";
  if (ownerAction && (auth.room.creator_id !== auth.actor.profileId || !requesterId || !UUID.test(requesterId)))
    return reply({ error: "Room owner required" }, 403);
  if (!ownerAction && (requesterId !== null || auth.room.creator_id === auth.actor.profileId))
    return reply({ error: "Invalid membership request" }, 400);
  const { data: status, error } = await auth.db.rpc("intimo_room_join_action", {
    p_room_id: params.id,
    p_actor_id: auth.actor.profileId,
    p_action: action,
    p_requester_id: ownerAction ? requesterId : null,
  });
  if (error) return reply({ error: "Request unavailable or no longer pending" }, 409);
  const audited = await appendDurableAudit(auth.db, {
    actorProfileId: auth.actor.profileId, actorUserId: auth.actor.userId,
    action: `ROOM_JOIN_${action}`, resourceType: "ROOM", resourceId: params.id,
    outcome: "SUCCESS", metadata: ownerAction ? { requesterId } : {},
  });
  if (!audited) return reply({ error: "Action applied but audit recording failed; contact support" }, 503);
  return reply({ status }, 200);
}
