import { NextRequest } from "next/server";
import { roomAccess, roomReply as reply } from "@/lib/rooms/access";
import { appendDurableAudit } from "@/lib/auth/durableAudit";
import { isVisibleMember } from "@/lib/auth/ageCheck.mjs";

export const dynamic = "force-dynamic";
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await roomAccess(req, params.id); if ("error" in auth) return auth.error;
  if (auth.room.creator_id !== auth.actor.profileId && !auth.admin) return reply({ error: "Room administrator required" }, 403);
  const { data, error } = await auth.db.from("room_members").select("profile_id,joined_at").eq("room_id", params.id).limit(100);
  if (error) return reply({ error: "Members unavailable" }, 502);
  const ids = (data || []).map(row => row.profile_id);
  const profiles = ids.length ? await auth.db.from("profiles").select("id,username,display_name").in("id", ids) : { data: [], error: null };
  if (profiles.error) return reply({ error: "Members unavailable" }, 502);
  return reply({ room: auth.room, members: (data || []).map(row => ({ ...row, username: profiles.data?.find(p => p.id === row.profile_id)?.username || profiles.data?.find(p => p.id === row.profile_id)?.display_name || "Member" })) });
}
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await roomAccess(req, params.id); if ("error" in auth) return auth.error;
  if (auth.room.builtin || (auth.room.creator_id !== auth.actor.profileId && !auth.admin)) return reply({ error: "Room administrator required" }, 403);
  let input: Record<string, unknown>; try { input = await req.json(); } catch { return reply({ error: "Invalid settings" }, 400); }
  if (typeof input.locked !== "boolean") return reply({ error: "Choose whether the room is members only" }, 400);
  const { error } = await auth.db.from("rooms").update({ locked: input.locked }).eq("id", params.id).eq("builtin", false);
  if (error) return reply({ error: "Settings unavailable" }, 502);
  await appendDurableAudit(auth.db, { actorProfileId: auth.actor.profileId, actorUserId: auth.actor.userId, action: "ROOM_LOCK_CHANGE", resourceType: "ROOM", resourceId: params.id, outcome: "SUCCESS", metadata: { locked: input.locked } });
  return reply({ locked: input.locked });
}
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await roomAccess(req, params.id); if ("error" in auth) return auth.error;
  if (auth.room.builtin || (auth.room.creator_id !== auth.actor.profileId && !auth.admin)) return reply({ error: "Room administrator required" }, 403);
  let input: Record<string, unknown>; try { input = await req.json(); } catch { return reply({ error: "Invalid member" }, 400); }
  const username = typeof input.username === "string" ? input.username.trim() : "";
  if (!username || username.length > 80) return reply({ error: "Enter an exact username" }, 400);
  const { data: profile, error } = await auth.db.from("profiles")
    .select("id,account_status,age_verification_status,is_demo,auth_id")
    .eq("username", username).maybeSingle();
  if (error) return reply({ error: "Member unavailable" }, 502);
  if (!profile || !profile.auth_id || profile.is_demo || !isVisibleMember(profile)) return reply({ error: "Active adult member not found" }, 404);
  // Membership must never override an existing two-way member block.
  const { data: block, error: blockError } = await auth.db.from("user_blocks")
    .select("id")
    .or(`and(blocker_id.eq.${auth.actor.profileId},blocked_profile_id.eq.${profile.id}),and(blocker_id.eq.${profile.id},blocked_profile_id.eq.${auth.actor.profileId})`)
    .limit(1).maybeSingle();
  if (blockError) return reply({ error: "Member unavailable" }, 502);
  if (block) return reply({ error: "Member unavailable" }, 404);
  const result = await auth.db.from("room_members").upsert({ room_id: params.id, profile_id: profile.id }, { onConflict: "room_id,profile_id" });
  if (result.error) return reply({ error: "Member could not be added" }, 502);
  await appendDurableAudit(auth.db, { actorProfileId: auth.actor.profileId, actorUserId: auth.actor.userId, action: "ROOM_MEMBER_ADD", resourceType: "ROOM", resourceId: params.id, outcome: "SUCCESS", metadata: { profileId: profile.id } });
  return reply({ added: true });
}
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await roomAccess(req, params.id); if ("error" in auth) return auth.error;
  if (auth.room.builtin || (auth.room.creator_id !== auth.actor.profileId && !auth.admin)) return reply({ error: "Room administrator required" }, 403);
  const profileId = req.nextUrl.searchParams.get("profileId") || "";
  if (!/^[0-9a-f-]{36}$/i.test(profileId) || profileId === auth.room.creator_id) return reply({ error: "Invalid member" }, 400);
  const { error } = await auth.db.from("room_members").delete().eq("room_id", params.id).eq("profile_id", profileId);
  if (error) return reply({ error: "Member could not be removed" }, 502);
  await auth.db.from("room_presence").delete().eq("room_id", params.id).eq("profile_id", profileId);
  await appendDurableAudit(auth.db, { actorProfileId: auth.actor.profileId, actorUserId: auth.actor.userId, action: "ROOM_MEMBER_REMOVE", resourceType: "ROOM", resourceId: params.id, outcome: "SUCCESS", metadata: { profileId } });
  return reply({ removed: true });
}
