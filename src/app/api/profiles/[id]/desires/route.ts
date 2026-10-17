import { NextRequest, NextResponse } from "next/server";
import { resolveMemberProfileAccess } from "@/lib/profiles/memberProfileAccess";
import { sharedDesireIds } from "@/lib/desires.mjs";

export const dynamic = "force-dynamic";

/** A member's desires as another member may see them: members-visible rows only, shared ones flagged. */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const access = await resolveMemberProfileAccess(req, params.id);
  if (!access.ok) return access.response;
  const { db, viewerId, targetId: id, isOwner } = access;

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
