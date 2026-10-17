import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { areFriends } from "@/lib/social/friendship";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Resolves whether the signed-in member may see member-only details of profile `id`:
 * active, not hidden from discovery, no block in either direction, and visible to them.
 */
export async function resolveMemberProfileAccess(req: NextRequest, rawId: string | undefined):
  Promise<{ ok: true; db: SupabaseClient; viewerId: string; targetId: string; isOwner: boolean } | { ok: false; response: NextResponse }> {
  const fail = (error: string, status: number) => ({ ok: false as const, response: NextResponse.json({ error }, { status }) });
  const auth = await resolveServerActor(req);
  if (auth.status === "unauthenticated") return fail("Authentication required", 401);
  if (auth.status !== "authenticated") return fail("Profile unavailable", auth.status === "unprovisioned" ? 403 : 503);
  if (!hasAdultAccess(auth.actor)) return fail("Adult access verification required", 403);
  const targetId = rawId?.trim() || "";
  if (!UUID.test(targetId)) return fail("Invalid profile identifier", 400);
  const db = getServerSupabase();
  if (!db) return fail("Profile unavailable", 503);

  const viewerId = auth.actor.profileId;
  const isOwner = targetId === viewerId;
  if (!isOwner) {
    const { data: target, error } = await db.from("profiles").select("id,account_status,discovery_disabled,profile_visibility").eq("id", targetId).maybeSingle();
    if (error) return fail("Profile lookup failed", 502);
    if (!target || target.account_status !== "ACTIVE" || target.discovery_disabled) return fail("Profile not found", 404);
    const { data: block, error: blockError } = await db.from("user_blocks").select("id").or(`and(blocker_id.eq.${viewerId},blocked_profile_id.eq.${targetId}),and(blocker_id.eq.${targetId},blocked_profile_id.eq.${viewerId})`).limit(1).maybeSingle();
    if (blockError || block) return fail("Profile not found", 404);
    const visible = ["EVERYONE", "MEMBERS_ONLY"].includes(target.profile_visibility)
      || (target.profile_visibility === "FRIENDS_ONLY" && await areFriends(viewerId, targetId));
    if (!visible) return fail("Profile not found", 404);
  }
  return { ok: true, db, viewerId, targetId, isOwner };
}
