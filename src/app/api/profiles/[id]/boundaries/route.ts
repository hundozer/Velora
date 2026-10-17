import { NextRequest, NextResponse } from "next/server";
import { resolveMemberProfileAccess } from "@/lib/profiles/memberProfileAccess";
import { resolveBoundaries } from "@/lib/boundaries.mjs";

export const dynamic = "force-dynamic";

/** A member's approach preferences (defaults applied), so others know how to approach them. */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const access = await resolveMemberProfileAccess(req, params.id);
  if (!access.ok) return access.response;
  const { data, error } = await access.db.from("member_boundaries").select("kind,preference").eq("profile_id", access.targetId);
  if (error) return NextResponse.json({ error: "Boundaries lookup failed" }, { status: 502 });
  return NextResponse.json({ boundaries: resolveBoundaries(data) }, { headers: { "Cache-Control": "private, no-store" } });
}
