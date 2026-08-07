import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, isAdminActor, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { toMemberVisibleProfile } from "@/lib/supabase/publicProfile";
import type { ProfileRow } from "@/lib/supabase/profileService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const actorResult = await resolveServerActor(req);
  if (actorResult.status === "unauthenticated") return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (actorResult.status !== "authenticated") return NextResponse.json({ error: "Profile unavailable" }, { status: actorResult.status === "unprovisioned" ? 403 : 503 });
  if (!hasAdultAccess(actorResult.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });

  const id = params.id?.trim();
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid profile identifier" }, { status: 400 });
  }
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Profile unavailable" }, { status: 503 });

  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: "Profile lookup failed" }, { status: 502 });
  if (!data) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const isOwner = data.auth_id === actorResult.actor.auth0Sub;
  if (!isOwner && !isAdminActor(actorResult.actor)) {
    const { data: block } = await supabase.from("user_blocks").select("id").or(`and(blocker_id.eq.${actorResult.actor.profileId},blocked_profile_id.eq.${id}),and(blocker_id.eq.${id},blocked_profile_id.eq.${actorResult.actor.profileId})`).limit(1).maybeSingle();
    if (block) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  if (!["EVERYONE", "MEMBERS_ONLY"].includes(data.profile_visibility) && !isOwner && !isAdminActor(actorResult.actor)) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  return NextResponse.json({ profile: toMemberVisibleProfile(data as ProfileRow), ownership: { isOwner } }, { headers: { "Cache-Control": "private, no-store" } });
}
