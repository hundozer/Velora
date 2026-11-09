import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { ResendClient } from "@/lib/notifications/resendClient";

export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };
const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

async function activeMember(req: NextRequest) {
  const result = await resolveServerActor(req);
  if (result.status !== "authenticated" || result.actor.accountStatus !== "ACTIVE" || !result.actor.emailVerified) return null;
  const db = getServerSupabase();
  if (!db) return null;
  const { data, error } = await db.from("profiles")
    .select("id,membership_level,account_status,account_lifecycle_status")
    .eq("id",result.actor.profileId).maybeSingle();
  if (error || data?.account_status !== "ACTIVE" || (data.account_lifecycle_status && data.account_lifecycle_status !== "ACTIVE")) return null;
  return { db, actor: result.actor, foundingMember: data.membership_level === "FOUNDING_MEMBER" };
}

export async function GET(req: NextRequest) {
  const auth = await activeMember(req);
  if (!auth) return NextResponse.json({ eligible: false }, { headers: noStore });
  if (auth.foundingMember) {
    return NextResponse.json({ eligible: true, unlimited: true }, { headers: noStore });
  }
  const { count, error } = await auth.db.from("member_email_invites")
    .select("id", { count: "exact", head: true })
    .eq("inviter_profile_id", auth.actor.profileId)
    .in("status", ["PENDING","SENT","REDEEMED"])
    .gte("created_at", (() => { const now = new Date(); const day = now.getUTCDate(); now.setUTCDate(1); now.setUTCMonth(now.getUTCMonth() - 3); const lastDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate(); now.setUTCDate(Math.min(day, lastDay)); return now.toISOString(); })());
  if (error) return NextResponse.json({ error: "Invitations unavailable" }, { status: 503, headers: noStore });
  return NextResponse.json({ eligible: true, remaining: Math.max(0, 3 - (count ?? 0)), allowance: 3, period: "3 months" }, { headers: noStore });
}

export async function POST(req: NextRequest) {
  const auth = await activeMember(req);
  if (!auth) return NextResponse.json({ error: "Active membership required" }, { status: 403, headers: noStore });
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
  // Privacy-preserving acknowledgement: this path does NOT send an email.
  // Never report sent=true when a recipient already has an account.
  if (existing?.length) return NextResponse.json({ accepted: true }, { headers: noStore });
  const hash = createHash("sha256").update(address).digest("hex");
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data: inviteId, error: claimError } = await auth.db.rpc("claim_member_email_invite", {
    p_inviter: auth.actor.profileId, p_email_hash: hash, p_token_hash: tokenHash
  });
  if (claimError || !inviteId) {
    const reason = claimError?.message || "";
    const duplicate = reason.includes("recent invitation");
    const limited = reason.includes("allowance exhausted");
    return NextResponse.json({ error: limited ? "You have used your three invitations for this three-month period." : duplicate ? "This address was invited recently." : "Invitation could not be created", },
      { status: limited || duplicate ? 429 : 503, headers: noStore });
  }
  const registrationUrl = `https://intimo.live/register?invite=${encodeURIComponent(token)}`;
  const html = `<div style="background:#101317;padding:36px 16px;font-family:Arial,Helvetica,sans-serif;color:#f1f3f5">
  <div style="max-width:520px;margin:auto;border:1px solid #333d46;border-radius:18px;background:#1a2026;padding:36px 28px">
    <p style="font-size:28px;font-weight:800;letter-spacing:-1px;margin:0;color:#ffffff">intimo<span style="color:#a9d8ee">●</span></p>
    <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#a9d8ee;margin-top:36px">A personal invitation</p>
    <h1 style="font-size:32px;line-height:1.15;letter-spacing:-1px;margin:10px 0 18px;color:white">Good people make<br/>good company.</h1>
    <p style="font-size:16px;line-height:1.7;color:#d3d9dd">Someone already on Intimo thinks you'd feel at home here.</p>
    <p style="font-size:16px;line-height:1.7;color:#d3d9dd">Intimo is a free, adults-only community for genuine connections, curiosity, and open-minded people.</p>
    <p style="margin:32px 0"><a href="${registrationUrl}" style="display:inline-block;border-radius:8px;background:#a9d8ee;color:#16232b;padding:15px 25px;font-size:15px;font-weight:bold;text-decoration:none">See what Intimo is about</a></p>
    <p style="font-size:13px;color:#91a0ab">No membership fees. No obligation. Just an invitation.</p>
  </div>
  <p style="max-width:520px;margin:20px auto 0;font-size:11px;line-height:1.6;color:#a9b4bd">Intimo is for adults aged 18+. You received this one-time invitation because someone who knows you said you'd be interested. If not, simply ignore this email. You are not subscribed to a mailing list.</p>
</div>`;
  try {
    const sent = await ResendClient.sendEmail({to: address,subject:"You have a personal invitation to Intimo",html});
    if (!sent.delivered || sent.provider !== "RESEND_API") throw new Error("Delivery unavailable");
    const {error: recordError} = await auth.db.from("member_email_invites")
      .update({status:"SENT",sent_at:new Date().toISOString(),provider_message_id:sent.id})
      .eq("id",inviteId).eq("inviter_profile_id",auth.actor.profileId);
    if (recordError) return NextResponse.json({error:"Email accepted, but tracking failed. Do not retry."},{status:502,headers:noStore});
    return NextResponse.json({accepted:true},{headers:noStore});
  } catch {
    await auth.db.from("member_email_invites").update({status:"FAILED"}).eq("id",inviteId).eq("inviter_profile_id",auth.actor.profileId);
    return NextResponse.json({error:"Email could not be sent. Please try again later."},{status:502,headers:noStore});
  }
}
