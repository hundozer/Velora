import { NextRequest, NextResponse } from "next/server";
import { getVerifiedIdentity } from "@/lib/auth0/serverSession";
import { managementRequest } from "@/lib/auth0/management";
import { getServerSupabase } from "@/lib/supabase/server";
import { auditLogger } from "@/lib/auth/auditLogger";
import { checkRateLimit } from "@/lib/security/rateLimiter";

export async function POST(req: NextRequest) {
  const identity = await getVerifiedIdentity(req);
  if (!identity) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const rate = checkRateLimit(`delete-account:${identity.sub}`, 3, 60 * 60);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many deletion attempts" }, { status: 429, headers: { "Retry-After": String(rate.resetInSeconds) } });
  }

  let confirmation: unknown;
  try {
    const body = await req.json();
    confirmation = body?.confirmation;
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
    const { data: profile, error: profileError } = await supabase.from("profiles").update({ account_status: "DELETION_REQUESTED", account_lifecycle_status: "DELETION_REQUESTED", deletion_requested_at: requestedAt, public_profile_visibility: false, profile_visibility: "PRIVATE", allow_direct_messages: false, updated_at: requestedAt }).eq("auth_id", identity.sub).select("id").maybeSingle();
    if (profileError || !profile) throw new Error("Deletion lifecycle could not be started");
    const { error: requestError } = await supabase.from("privacy_requests").insert({ profile_id: profile.id, request_type: "DELETION", status: "IN_PROGRESS", requested_at: requestedAt, notes: "Self-service deletion; identity deactivation initiated" });
    if (requestError) throw new Error("Deletion request could not be recorded");

    const auth0Response = await managementRequest(`/users/${encodeURIComponent(identity.sub)}`, { method: "DELETE" });
    if (!auth0Response.ok && auth0Response.status !== 404) {
      throw new Error(`Auth0 user deletion failed (${auth0Response.status})`);
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
    return NextResponse.json({ success: true });
  } catch (error) {
    auditLogger.logEvent({ actorId: identity.sub, actorRole: "MEMBER", action: "GDPR_DELETE_ACCOUNT", status: "ERROR" });
    console.error("Account deletion failed", error);
    return NextResponse.json({ error: "Account deletion could not be completed" }, { status: 502 });
  }
}
