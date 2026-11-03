import { NextRequest, NextResponse } from "next/server";
import { getVerifiedIdentity } from "@/lib/auth/serverSession";
import { getServerSupabase } from "@/lib/supabase/server";
import { auditLogger } from "@/lib/auth/auditLogger";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { appendDurableAudit } from "@/lib/auth/durableAudit";
import { cleanLeavingReason, notifyAccountDeleted } from "@/lib/notifications/registrationAlert";

export async function POST(req: NextRequest) {
  const identity = await getVerifiedIdentity(req);
  if (!identity) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const rate = (await checkRateLimit(`delete-account:${identity.sub}`, 3, 60 * 60));
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many deletion attempts" }, { status: 429, headers: { "Retry-After": String(rate.resetInSeconds) } });
  }

  let confirmation: unknown;
  let reason: ReturnType<typeof cleanLeavingReason> = null;
  let note: string | null = null;
  try {
    const body = await req.json();
    confirmation = body?.confirmation;
    // Optional, and only used to tell the team why people leave.
    reason = cleanLeavingReason(body?.reason);
    note = typeof body?.note === "string" && body.note.trim() ? body.note.trim().slice(0, 500) : null;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (confirmation !== "DELETE") {
    return NextResponse.json({ error: "Type DELETE to confirm permanent account deletion" }, { status: 400 });
  }

  try {
    const supabase = getServerSupabase();
    if (!supabase) return NextResponse.json({ error: "Deletion service unavailable" }, { status: 503 });
    const requestedAt = new Date().toISOString();
    const { data: profile, error: profileError } = await supabase.from("profiles").update({ account_status: "DELETION_REQUESTED", account_lifecycle_status: "DELETION_REQUESTED", deletion_requested_at: requestedAt, public_profile_visibility: false, profile_visibility: "PRIVATE", allow_direct_messages: false, updated_at: requestedAt }).eq("auth_id", identity.sub).select("id, display_name, created_at").maybeSingle();
    if (profileError || !profile) throw new Error("Deletion lifecycle could not be started");
    const { error: requestError } = await supabase.from("privacy_requests").insert({ profile_id: profile.id, request_type: "DELETION", status: "IN_PROGRESS", requested_at: requestedAt, notes: "Self-service deletion; identity deactivation initiated" });
    if (requestError) throw new Error("Deletion request could not be recorded");

    // Removing the auth user revokes every session and frees the email address.
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(identity.sub);
    if (authDeleteError && authDeleteError.status !== 404) {
      throw new Error(`Auth user deletion failed (${authDeleteError.status})`);
    }

    const deactivatedAt = new Date().toISOString();
    const { error } = await supabase.from("profiles").update({ account_status: "DEACTIVATED", account_lifecycle_status: "DEACTIVATED", deactivated_at: deactivatedAt, updated_at: deactivatedAt }).eq("id", profile.id).eq("auth_id", identity.sub);
    if (error) throw new Error("Profile deactivation failed");

    auditLogger.logEvent({
      actorId: identity.sub,
      actorRole: "MEMBER",
      action: "GDPR_DELETE_ACCOUNT",
      status: "SUCCESS",
      details: { selfService: true, lifecycleStatus: "DEACTIVATED", hardDeletionPending: true },
    });
    await appendDurableAudit(supabase, { actorProfileId: profile.id, actorUserId: identity.sub, action: "GDPR_DELETE_ACCOUNT", resourceType: "PROFILE", resourceId: profile.id, outcome: "SUCCESS", metadata: { lifecycleStatus: "DEACTIVATED", hardDeletionPending: true, reason } });
    // Best effort: tell the team (registration@intimo.live). Never affects the deletion.
    await notifyAccountDeleted({ profileId: String(profile.id), displayName: String(profile.display_name || "A member"), joinedAt: profile.created_at ? String(profile.created_at) : null, reason, note });
    return NextResponse.json({ success: true });
  } catch (error) {
    auditLogger.logEvent({ actorId: identity.sub, actorRole: "MEMBER", action: "GDPR_DELETE_ACCOUNT", status: "ERROR" });
    console.error("Account deletion failed", error);
    return NextResponse.json({ error: "Account deletion could not be completed" }, { status: 502 });
  }
}
