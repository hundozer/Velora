import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { ResendClient } from "@/lib/notifications/resendClient";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };
const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

async function founder(req: NextRequest) {
  const result = await resolveServerActor(req);
  if (result.status !== "authenticated" || result.actor.accountStatus !== "ACTIVE" || !result.actor.emailVerified) return null;
  const db = getServerSupabase();
  if (!db) return null;
  const { data, error } = await db.from("profiles")
    .select("id,membership_level,account_status,account_lifecycle_status")
    .eq("id",result.actor.profileId).maybeSingle();
  if (error || data?.membership_level !== "FOUNDING_MEMBER" || data.account_status !== "ACTIVE" || (data.account_lifecycle_status && data.account_lifecycle_status !== "ACTIVE")) return null;
  return { db, actor: result.actor };
}

export async function GET(req: NextRequest) {
  const auth = await founder(req);
  if (!auth) return NextResponse.json({ eligible: false }, { headers: noStore });
  const { count, error } = await auth.db.from("member_email_invites")
    .select("id", { head: true, count: "exact" })
    .eq("inviter_profile_id", auth.actor.profileId)
    .in("status", ["PENDING","SENT"])
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  if (error) return NextResponse.json({ error: "Invitations unavailable" }, { status: 503, headers: noStore });
  return NextResponse.json({ eligible: true, remaining: Math.max(0, 5 - (count || 0)) }, { headers: noStore });
}

export async function POST(req: NextRequest) {
  const auth = await founder(req);
  if (!auth) return NextResponse.json({ error: "Founding Member access required" }, { status: 403, headers: noStore });
  let input: unknown;
  try { input = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400, headers: noStore }); }
  if (!input || typeof input !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400, headers: noStore });
  const body = input as Record<string,unknown>;
  const address = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (address.length > 254 || !emailPattern.test(address) || body.permissionConfirmed !== true) {
    return NextResponse.json({ error: "Enter a valid email and confirm this person agreed to receive an invitation" }, { status: 400, headers: noStore });
  }
  if (address === auth.actor.email?.trim().toLowerCase()) {
    return NextResponse.json({ error: "You cannot invite your own address" }, { status: 400, headers: noStore });
  }
  // Do not email existing members or disclose whether an email has an Intimo account.
  const { data: existing, error: existingError } = await auth.db.from("profiles").select("id").eq("email", address).limit(1);
  if (existingError) return NextResponse.json({ error: "Invitations temporarily unavailable" }, { status: 503, headers: noStore });
  if (existing?.length) return NextResponse.json({ sent: true, remaining: null }, { headers: noStore });
  const hash = createHash("sha256").update(address).digest("hex");
  const { data: inviteId, error: claimError } = await auth.db.rpc("claim_founder_email_invite", {
    p_inviter: auth.actor.profileId, p_email_hash: hash
  });
  if (claimError || !inviteId) {
    const reason = claimError?.message || "";
    const duplicate = reason.includes("recent invitation");
    const limited = reason.includes("limit");
    return NextResponse.json({ error: limited ? "Five invitations per 24 hours. Try again later." : duplicate ? "This address was invited recently." : "Invitation could not be created", },
      { status: limited || duplicate ? 429 : 503, headers: noStore });
  }
  const html = `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#20242b;max-width:560px;margin:auto">
    <h2>You're invited to Intimo</h2>
    <p>Someone in the Intimo community thought you might like to join.</p>
    <p>It's a free, adults-only community. Joining is entirely your choice.</p>
    <p><a href="https://intimo.live/register" style="background:#20242b;color:white;padding:12px 20px;border-radius:8px;text-decoration:none">Explore Intimo</a></p>
    <p style="color:#68717c;font-size:12px">This is a one-time personal invitation, not a mailing-list subscription. If you're not interested, ignore this email. You must be 18 or older to join.</p>
  </div>`;
  try {
    const sent = await ResendClient.sendEmail({to: address,subject:"A personal invitation to Intimo",html});
    if (!sent.delivered) throw new Error("Delivery unavailable");
    await auth.db.from("member_email_invites").update({status:"SENT",sent_at:new Date().toISOString()}).eq("id",inviteId).eq("inviter_profile_id",auth.actor.profileId);
    return NextResponse.json({sent:true},{headers:noStore});
  } catch {
    await auth.db.from("member_email_invites").update({status:"FAILED"}).eq("id",inviteId).eq("inviter_profile_id",auth.actor.profileId);
    return NextResponse.json({error:"Email could not be sent. Please try again later."},{status:502,headers:noStore});
  }
}
