import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission, requestSecurityMetadata } from "@/lib/auth/adminApi";
import { getServerSupabase } from "@/lib/supabase/server";
import { sendFoundingMemberPromotionEmail } from "@/lib/notifications/foundingMemberPromotion";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const headers = { "Cache-Control": "private, no-store" };

export async function POST(req: NextRequest) {
  const auth = await requireAdminPermission(req, "admin_roles:manage");
  if ("response" in auth) return auth.response;
  if (auth.actor.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Super Admin required" }, { status: 403, headers });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400, headers }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400, headers });
  const payload = body as Record<string, unknown>;
  const profileId = typeof payload.profileId === "string" ? payload.profileId : "";
  if (!UUID.test(profileId) || payload.confirmation !== "SEND FOUNDING WELCOME") {
    return NextResponse.json({ error: "Select a member and confirm email delivery" }, { status: 400, headers });
  }
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Email service unavailable" }, { status: 503, headers });
  const { data: member, error: memberError } = await db.from("profiles")
    .select("id,email,display_name,username,languages,email_opt_out,membership_level,account_status,account_lifecycle_status")
    .eq("id", profileId).maybeSingle();
  if (memberError || !member) return NextResponse.json({ error: "Member not found" }, { status: 404, headers });
  if (member.membership_level !== "FOUNDING_MEMBER" || member.account_status !== "ACTIVE" ||
    (member.account_lifecycle_status && member.account_lifecycle_status !== "ACTIVE")) {
    return NextResponse.json({ error: "An active Founding Member is required" }, { status: 409, headers });
  }
  if (Array.isArray(member.email_opt_out) && member.email_opt_out.length > 0) {
    return NextResponse.json({ error: "This member has opted out of email" }, { status: 409, headers });
  }
  if (!member.email) return NextResponse.json({ error: "Member email unavailable" }, { status: 409, headers });

  // A database primary key ensures concurrent requests cannot dispatch duplicates.
  const { error: claimError } = await db.from("founding_member_welcome_deliveries").insert({
    profile_id: profileId, requested_by: auth.actor.profileId, status: "PENDING"
  });
  if (claimError) {
    if (claimError.code === "23505") return NextResponse.json({ error: "A welcome email was already requested for this member" }, { status: 409, headers });
    return NextResponse.json({ error: "Email delivery cannot be reserved" }, { status: 503, headers });
  }

  const language = Array.isArray(member.languages) &&
    member.languages.some((value: unknown) => ["cs", "czech", "čeština"].includes(String(value).toLowerCase())) ? "cs" : "en";
  try {
    const result = await sendFoundingMemberPromotionEmail(
      member.email, member.display_name || member.username || "Member", language
    );
    if (!result.delivered || result.provider !== "RESEND_API") throw Error("Resend did not confirm acceptance");
    const { error: recordError } = await db.from("founding_member_welcome_deliveries")
      .update({ status: "SENT", sent_at: new Date().toISOString(), provider_message_id: result.id })
      .eq("profile_id", profileId);
    if (recordError) {
      console.error("Founder welcome sent but tracking failed", { profileId, code: recordError.code });
      return NextResponse.json({ error: "Resend accepted the email, but recording delivery failed. Do not resend." }, { status: 502, headers });
    }
    await db.from("admin_action_events").insert({
      actor_profile_id: auth.actor.profileId, actor_role: auth.actor.role,
      action: "FOUNDING_MEMBER_WELCOME_SENT", category: "ADMINISTRATION",
      resource_type: "PROFILE", resource_id: profileId,
      reason: "One-time welcome notification for existing Founding Member",
      previous_state: {}, new_state: { provider: "RESEND_API", messageId: result.id },
      security_metadata: requestSecurityMetadata(req)
    });
    return NextResponse.json({ sent: true, provider: "RESEND_API" }, { headers });
  } catch (error) {
    const { error: recordError } = await db.from("founding_member_welcome_deliveries")
      .update({ status: "FAILED" }).eq("profile_id", profileId);
    if (recordError) console.error("Founder welcome failure tracking failed", { code: recordError.code });
    console.error("Founder welcome dispatch failed", { profileId, message: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json({ error: "Resend did not confirm email acceptance. Review the delivery ledger before trying again." },
      { status: 502, headers });
  }
}
