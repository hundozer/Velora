import { NextRequest, NextResponse } from "next/server";
import { resolveMemberProfileAccess } from "@/lib/profiles/memberProfileAccess";
import { resolveBoundaries, senderCategory } from "@/lib/boundaries.mjs";
import { approachFor, boundarySentences } from "@/lib/approach.mjs";
import { isVerifiedMember } from "@/lib/planEligibility.mjs";
import { subject } from "@/lib/peopleCopy.mjs";
import { areFriends } from "@/lib/social/friendship";

export const dynamic = "force-dynamic";

/**
 * How the signed-in viewer may approach this member: boundaries as sentences (the one
 * that applies to the viewer flagged), whether they can write first, and the single rule
 * line shown above "Begin a conversation". Read-only; POST /api/messages stays authoritative.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const access = await resolveMemberProfileAccess(req, params.id);
  if (!access.ok) return access.response;
  const { db, viewerId, targetId, isOwner } = access;

  const [{ data: target, error: targetError }, { data: viewer, error: viewerError }, { data: rows, error: rowsError }, { data: replied, error: repliedError }] = await Promise.all([
    db.from("profiles").select("display_name,gender,is_couple_profile,allow_direct_messages,message_permission").eq("id", targetId).maybeSingle(),
    db.from("profiles").select("gender,is_couple_profile,verification_status,verification_level").eq("id", viewerId).maybeSingle(),
    db.from("member_boundaries").select("kind,preference").eq("profile_id", targetId),
    isOwner ? Promise.resolve({ data: null, error: null }) : db.from("direct_messages").select("id").eq("sender_id", targetId).eq("receiver_id", viewerId).limit(1).maybeSingle(),
  ]);
  if (targetError || viewerError || rowsError || repliedError || !target || !viewer) return NextResponse.json({ error: "Approach lookup failed" }, { status: 502 });

  const boundaries = resolveBoundaries(rows);
  const person = { gender: target.gender, isCoupleProfile: target.is_couple_profile };
  const viewerVerified = isVerifiedMember(viewer);
  const viewerCategory = senderCategory(viewer.gender, viewer.is_couple_profile);
  const sentences = boundarySentences(boundaries, { subject: subject(person), viewerCategory: isOwner ? null : viewerCategory, viewerVerified: isOwner || viewerVerified });
  if (isOwner) return NextResponse.json({ isOwner: true, boundaries, sentences, canWrite: false, line: null, established: false }, { headers: { "Cache-Control": "private, no-store" } });

  const established = Boolean(replied);
  const friends = !established && target.message_permission === "FRIENDS_ONLY" ? await areFriends(viewerId, targetId) : false;
  const name = String(target.display_name || "This member");
  const approach = approachFor({ name, boundaries, recipient: target, viewer: { gender: viewer.gender, isCoupleProfile: viewer.is_couple_profile, verified: viewerVerified }, established, friends });
  return NextResponse.json({
    isOwner: false,
    boundaries,
    sentences,
    established,
    canWrite: approach.canWrite,
    line: approach.line,
    explicitMediaInChat: boundaries.EXPLICIT_MEDIA_IN_CHAT,
  }, { headers: { "Cache-Control": "private, no-store" } });
}
