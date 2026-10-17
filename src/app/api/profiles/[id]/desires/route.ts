import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { areFriends } from "@/lib/social/friendship";
import { sharedDesireIds } from "@/lib/desires.mjs";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** A member's desires as another member may see them: members-visible rows only, shared ones flagged. */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await resolveServerActor(req);
  if (auth.status === "unauthenticated") return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (auth.status !== "authenticated") return NextResponse.json({ error: "Desires unavailable" }, { status: auth.status === "unprovisioned" ? 403 : 503 });
  if (!hasAdultAccess(auth.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  const id = params.id?.trim();
  if (!id || !UUID.test(id)) return NextResponse.json({ error: "Invalid profile identifier" }, { status: 400 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Desires unavailable" }, { status: 503 });

  const viewerId = auth.actor.profileId;
  const isOwner = id === viewerId;
  if (!isOwner) {
    const { data: target, error } = await db.from("profiles").select("id,account_status,discovery_disabled,profile_visibility").eq("id", id).maybeSingle();
    if (error) return NextResponse.json({ error: "Desires lookup failed" }, { status: 502 });
    if (!target || target.account_status !== "ACTIVE" || target.discovery_disabled) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    const { data: block, error: blockError } = await db.from("user_blocks").select("id").or(`and(blocker_id.eq.${viewerId},blocked_profile_id.eq.${id}),and(blocker_id.eq.${id},blocked_profile_id.eq.${viewerId})`).limit(1).maybeSingle();
    if (blockError || block) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    const visible = ["EVERYONE", "MEMBERS_ONLY"].includes(target.profile_visibility)
      || (target.profile_visibility === "FRIENDS_ONLY" && await areFriends(viewerId, id));
    if (!visible) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  let theirsQuery = db.from("member_desires").select("desire_id,state").eq("profile_id", id);
  if (!isOwner) theirsQuery = theirsQuery.eq("visibility", "MEMBERS");
  const [{ data: theirs, error: theirsError }, { data: mine, error: mineError }] = await Promise.all([
    theirsQuery,
    isOwner ? Promise.resolve({ data: [], error: null }) : db.from("member_desires").select("desire_id,state").eq("profile_id", viewerId),
  ]);
  if (theirsError || mineError) return NextResponse.json({ error: "Desires lookup failed" }, { status: 502 });
  return NextResponse.json(
    { desires: theirs || [], shared: isOwner ? [] : sharedDesireIds(mine || [], theirs || []) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
