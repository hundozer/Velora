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
  // Only the inviter's own records. Recipient addresses and token hashes stay private.
  const { data: recent, error: recentError } = await auth.db.from("member_email_invites")
    .select("id,status,created_at,sent_at,redeemed_at,expires_at,redeemed_auth_id")
    .eq("inviter_profile_id", auth.actor.profileId)
    .order("created_at", { ascending: false }).limit(20);
  if (recentError) return NextResponse.json({ error: "Invitation history unavailable" }, { status: 503, headers: noStore });

  const [issued, joined, outstanding, failed] = await Promise.all([
    auth.db.from("member_email_invites").select("id", { count: "exact", head: true })
      .eq("inviter_profile_id", auth.actor.profileId).in("status", ["SENT","REDEEMED"]),
    auth.db.from("member_email_invites").select("id", { count: "exact", head: true })
      .eq("inviter_profile_id", auth.actor.profileId).eq("status", "REDEEMED"),
    auth.db.from("member_email_invites").select("id", { count: "exact", head: true })
      .eq("inviter_profile_id", auth.actor.profileId).eq("status", "SENT")
      .gt("expires_at", new Date().toISOString()),
    auth.db.from("member_email_invites").select("id", { count: "exact", head: true })
      .eq("inviter_profile_id", auth.actor.profileId).eq("status", "FAILED"),
  ]);
  if ([issued, joined, outstanding, failed].some(result => result.error)) {
    return NextResponse.json({ error: "Invitation metrics unavailable" }, { status: 503, headers: noStore });
  }

  // A first interaction is observable only through actual messages or interests,
  // not a click on the invite email. Do not expose the invitee's identity.
  const redeemed = (recent ?? []).filter(row => row.status === "REDEEMED" && row.redeemed_auth_id);
  const ids = redeemed.map(row => row.redeemed_auth_id as string);
  const [messages, interests] = ids.length ? await Promise.all([
    auth.db.from("direct_messages").select("sender_id,created_at").in("sender_id", ids).limit(500),
    auth.db.from("interests").select("from_id,created_at").in("from_id", ids).limit(500),
  ]) : [{ data: [], error: null }, { data: [], error: null }];
  if (messages.error || interests.error) {
    return NextResponse.json({ error: "Invitation activity unavailable" }, { status: 503, headers: noStore });
  }
  const now = Date.now();
  const history = (recent ?? []).map(row => {
    const firstContact = row.status === "REDEEMED" && row.redeemed_auth_id && row.redeemed_at
      ? Boolean(messages.data?.some(item => item.sender_id === row.redeemed_auth_id && new Date(item.created_at).getTime() >= new Date(row.redeemed_at!).getTime())
        || interests.data?.some(item => item.from_id === row.redeemed_auth_id && new Date(item.created_at).getTime() >= new Date(row.redeemed_at!).getTime()))
      : false;
    return {
      id: row.id, createdAt: row.created_at, sentAt: row.sent_at, joinedAt: row.redeemed_at,
      status: row.status === "REDEEMED" ? "JOINED"
        : row.status === "SENT" && row.expires_at && new Date(row.expires_at).getTime() <= now ? "EXPIRED"
        : row.status, firstContact,
    };
  });

  let remaining: number | null = null;
  if (!auth.foundingMember) {
    const nowDate = new Date();
    const day = nowDate.getUTCDate();
    nowDate.setUTCDate(1);
    nowDate.setUTCMonth(nowDate.getUTCMonth() - 3);
    const lastDay = new Date(Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth()+1, 0)).getUTCDate();
    nowDate.setUTCDate(Math.min(day, lastDay));
    const { count, error } = await auth.db.from("member_email_invites")
      .select("id", { count: "exact", head: true })
      .eq("inviter_profile_id", auth.actor.profileId)
      .in("status", ["PENDING","SENT","REDEEMED"])
      .gte("created_at", nowDate.toISOString());
    if (error) return NextResponse.json({ error: "Invitation allowance unavailable" }, { status: 503, headers: noStore });
    remaining = Math.max(0, 3 - (count ?? 0));
  }
  return NextResponse.json({
    eligible: true, unlimited: auth.foundingMember, remaining,
    allowance: auth.foundingMember ? null : 3, period: auth.foundingMember ? null : "3 months",
    totals: { issued: issued.count ?? 0, joined: joined.count ?? 0,
      awaiting: outstanding.count ?? 0, failed: failed.count ?? 0 },
    history,
  }, { headers: noStore });
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
