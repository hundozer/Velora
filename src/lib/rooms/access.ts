import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, isAdminActor, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";

export const roomReply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

export async function roomActor(req: NextRequest) {
  const result = await resolveServerActor(req);
  if (result.status !== "authenticated") return { error: roomReply({ error: "Sign in to enter rooms" }, result.status === "unauthenticated" ? 401 : 503) };
  if (!hasAdultAccess(result.actor) && !isAdminActor(result.actor)) return { error: roomReply({ error: "Active adult account required" }, 403) };
  const db = getServerSupabase();
  return db ? { db, actor: result.actor } : { error: roomReply({ error: "Rooms unavailable" }, 503) };
}

export async function roomAccess(req: NextRequest, id: string) {
  const auth = await roomActor(req); if ("error" in auth) return { error: auth.error };
  if (!/^[a-z0-9-]{1,64}$/.test(id)) return { error: roomReply({ error: "Room unavailable" }, 404) };
  const { data: room, error } = await auth.db.from("rooms").select("id,title,description,creator_id,builtin,locked,expires_at").eq("id", id).maybeSingle();
  if (error) return { error: roomReply({ error: "Room unavailable" }, 502) };
  if (!room || (room.expires_at && Date.parse(room.expires_at) <= Date.now())) return { error: roomReply({ error: "Room has expired or is unavailable" }, 404) };
  const admin = isAdminActor(auth.actor);
  if (room.locked && room.creator_id !== auth.actor.profileId && !admin) {
    const { data: member, error: memberError } = await auth.db.from("room_members").select("profile_id").eq("room_id", id).eq("profile_id", auth.actor.profileId).maybeSingle();
    if (memberError) return { error: roomReply({ error: "Room unavailable" }, 502) };
    if (!member) return { error: roomReply({ error: "This room is for its approved members" }, 403) };
  }
  return { db: auth.db, actor: auth.actor, room, admin };
}
