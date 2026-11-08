import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission, requestSecurityMetadata } from "@/lib/auth/adminApi";
import { getServerSupabase } from "@/lib/supabase/server";
import { sendFoundingMemberPromotionEmail } from "@/lib/notifications/foundingMemberPromotion";

const LEVELS = ["MEMBER", "FOUNDING_MEMBER", "VIP"] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(req: NextRequest) {
  const auth = await requireAdminPermission(req, "admin_roles:manage");
  if ("response" in auth) return auth.response;
  // Recognition assignments are deliberately restricted to the owner role.
  if (auth.actor.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Super Admin authorization required" }, { status: 403 });
  }
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const input = body as Record<string, unknown>;
  const profileId = typeof input.profileId === "string" ? input.profileId : "";
  const level = typeof input.level === "string" ? input.level : "";
  const reason = typeof input.reason === "string" ? input.reason.trim() : "";
  if (!UUID.test(profileId) || !LEVELS.some(value => value === level) || reason.length < 5 || reason.length > 500 || input.confirmation !== `CONFIRM ${level}`) {
    return NextResponse.json({ error: "Choose a valid member, level and reason; confirm the change" }, { status: 400 });
  }
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Membership management unavailable" }, { status: 503 });
  const { data: before, error: lookupError } = await db.from("profiles")
    .select("id,membership_level,account_status,account_lifecycle_status")
    .eq("id", profileId).maybeSingle();
  if (lookupError) return NextResponse.json({ error: "Member lookup failed" }, { status: 502 });
  if (!before) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  if (before.account_status !== "ACTIVE" || (before.account_lifecycle_status && before.account_lifecycle_status !== "ACTIVE")) {
    return NextResponse.json({ error: "Only active members may receive a recognition level" }, { status: 409 });
  }
  if (before.membership_level === level) return NextResponse.json({ membershipLevel: level, unchanged: true }, { headers: { "Cache-Control": "no-store" } });
  const { data: updated, error: updateError } = await db.from("profiles")
    .update({ membership_level: level }).eq("id", profileId).eq("membership_level", before.membership_level)
    .select("id,membership_level").maybeSingle();
  if (updateError) return NextResponse.json({ error: "Membership update failed; verify the migration is applied" }, { status: 502 });
  if (!updated) return NextResponse.json({ error: "Membership was changed concurrently; refresh and retry" }, { status: 409 });
  const { error: auditError } = await db.from("admin_action_events").insert({
    actor_profile_id: auth.actor.profileId,
    actor_role: auth.actor.role,
    action: "MEMBERSHIP_LEVEL_CHANGED",
    category: "ADMINISTRATION",
    resource_type: "PROFILE",
    resource_id: profileId,
    reason,
    previous_state: { membership_level: before.membership_level },
    new_state: { membership_level: updated.membership_level },
    security_metadata: requestSecurityMetadata(req),
  });
  if (auditError) return NextResponse.json({ error: "Membership changed but audit failed; escalate to administrator" }, { status: 502 });
  // Notification is sent once on the actual transition, after successful audit.
  // Email delivery errors do not undo the membership promotion.
  let promotionEmail: "sent" | "failed" | "not_applicable" = "not_applicable";
  if (updated.membership_level === "FOUNDING_MEMBER" && before.membership_level !== "FOUNDING_MEMBER") {
    promotionEmail = "failed";
    const { data: recipient, error: recipientError } = await db.from("profiles")
      .select("email,display_name,username,languages,email_opt_out")
      .eq("id", profileId).maybeSingle();
    if (!recipientError && recipient?.email && !recipient.email_opt_out) {
      const language = Array.isArray(recipient.languages) && recipient.languages.some((l: unknown) => String(l).toLowerCase().startsWith("czech") || String(l).toLowerCase() === "cs") ? "cs" : "en";
      try {
        const delivery = await sendFoundingMemberPromotionEmail(
          recipient.email, recipient.display_name || recipient.username || "Member", language
        );
        if (delivery.delivered && delivery.provider === "RESEND_API") promotionEmail = "sent";
      } catch (error) {
        console.error("Founding Member promotion notification failed", { profileId, message: error instanceof Error ? error.message : "unknown" });
      }
    }
  }
  return NextResponse.json({ membershipLevel: updated.membership_level, promotionEmail }, { headers: { "Cache-Control": "no-store" } });
}
