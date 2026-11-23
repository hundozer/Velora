import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { appendDurableAudit } from "@/lib/auth/durableAudit";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

// Generate a fresh one-use link on demand. Never persist or return the token
// on subsequent GET requests: only its SHA-256 hash is stored.
export async function POST(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated" || actor.actor.accountStatus !== "ACTIVE" || !actor.actor.emailVerified)
    return NextResponse.json({ error: "Active verified membership required" }, { status: 403, headers });

  const rate = (await checkRateLimit(`member-share-invite:${actor.actor.userId}`, 8, 24 * 60 * 60));
  if (!rate.allowed) return NextResponse.json({ error: "Too many invitation links today. Try again tomorrow." }, { status: 429, headers });

  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Invitations unavailable" }, { status: 503, headers });
  const { data: member, error: memberError } = await db.from("profiles")
    .select("id,account_status,account_lifecycle_status")
    .eq("id", actor.actor.profileId).maybeSingle();
  if (memberError || !member || member.account_status !== "ACTIVE" ||
      (member.account_lifecycle_status && member.account_lifecycle_status !== "ACTIVE"))
    return NextResponse.json({ error: "Active membership required" }, { status: 403, headers });

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data: codeId, error } = await db.rpc("claim_member_share_invite", {
    p_inviter: actor.actor.profileId, p_token_hash: tokenHash,
  });
  if (error || !codeId) {
    const limited = error?.message?.toLowerCase().includes("allowance exhausted");
    return NextResponse.json({
      error: limited ? "You have used your three invitations for this three-month period." : "Invitation link could not be created.",
    }, { status: limited ? 429 : 503, headers });
  }
  // Do not turn audit failures into a second token issue; a token is already issued.
  const audited = await appendDurableAudit(db, {
    actorProfileId: actor.actor.profileId, actorUserId: actor.actor.userId,
    action: "MEMBER_SHARE_INVITE_CREATE", resourceType: "INVITATION_CODE", resourceId: String(codeId),
    outcome: "SUCCESS", metadata: { maxUses: 1, validityDays: 30 },
  });
  if (!audited) return NextResponse.json({
    error: "The invitation was created but could not be displayed. Please contact support before retrying.",
  }, { status: 502, headers });
  // Fixed trusted origin; never derive the invitation domain from a request Host header.
  return NextResponse.json({
    url: `https://intimo.live/register?invite=${encodeURIComponent(token)}`,
    expiresInDays: 30, uses: 1,
  }, { status: 201, headers });
}
