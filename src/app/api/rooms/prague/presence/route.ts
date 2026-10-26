import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

async function access(req: NextRequest) {
  const result = await resolveServerActor(req);
  if (result.status !== "authenticated") return { error: reply({ error: "Authentication required" }, result.status === "unauthenticated" ? 401 : 503) };
  if (!hasAdultAccess(result.actor)) return { error: reply({ error: "Adult account required" }, 403) };
  const db = getServerSupabase();
  return db ? { actor: result.actor, db } : { error: reply({ error: "Room unavailable" }, 503) };
}

export async function POST(req: NextRequest) {
  const auth = await access(req); if ("error" in auth) return auth.error;
  const { data: profile, error: profileError } = await auth.db.from("profiles").select("id").eq("id", auth.actor.profileId).eq("is_demo", false).maybeSingle();
  if (profileError) return reply({ error: "Room unavailable" }, 502);
  if (!profile) return reply({ error: "Member account required" }, 403);
  const { error } = await auth.db.from("room_presence").upsert({ profile_id: auth.actor.profileId, room_id: "prague", last_seen_at: new Date().toISOString() }, { onConflict: "room_id,profile_id" });
  return error ? reply({ error: "Presence unavailable" }, 502) : reply({ present: true });
}

export async function GET(req: NextRequest) {
  const auth = await access(req); if ("error" in auth) return auth.error;
  const cutoff = new Date(Date.now() - 90_000).toISOString();
  const [presence, blocks] = await Promise.all([
    auth.db.from("room_presence").select("profile_id,last_seen_at").eq("room_id", "prague").gte("last_seen_at", cutoff).order("last_seen_at", { ascending: false }).limit(200),
    auth.db.from("user_blocks").select("blocker_id,blocked_profile_id").or(`blocker_id.eq.${auth.actor.profileId},blocked_profile_id.eq.${auth.actor.profileId}`),
  ]);
  if (presence.error || blocks.error) return reply({ error: "Presence unavailable" }, 502);
  const hidden = new Set((blocks.data || []).map(b => b.blocker_id === auth.actor.profileId ? b.blocked_profile_id : b.blocker_id));
  const ids = (presence.data || []).map(row => row.profile_id).filter(id => !hidden.has(id));
  const profiles = ids.length ? await auth.db.from("profiles").select("id,username,display_name,avatar_url,account_status,auth_id,is_demo,show_online_status").in("id", ids) : { data: [], error: null };
  if (profiles.error) return reply({ error: "Presence unavailable" }, 502);
  const visible = new Map((profiles.data || []).filter(p => p.account_status === "ACTIVE" && p.auth_id && !p.is_demo && p.show_online_status === true).map(p => [p.id, p]));
  return reply({ members: ids.flatMap(id => { const p = visible.get(id); return p ? [{ id, username: p.username || p.display_name, avatarUrl: p.avatar_url || null }] : []; }) });
}

export async function DELETE(req: NextRequest) {
  const auth = await access(req); if ("error" in auth) return auth.error;
  const { error } = await auth.db.from("room_presence").delete().eq("profile_id", auth.actor.profileId).eq("room_id", "prague");
  return error ? reply({ error: "Presence unavailable" }, 502) : reply({ present: false });
}
