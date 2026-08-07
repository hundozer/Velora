import { NextRequest, NextResponse } from "next/server";
import { adminSessionFresh, AdminPermission, hasAdminPermission } from "@/lib/auth/adminAuthorization";
import { requestSecurityMetadata, requireAdminPermission } from "@/lib/auth/adminApi";
import { getServerSupabase } from "@/lib/supabase/server";

const ACTIONS: Record<string, { permission: AdminPermission; status?: string; flags?: Record<string, boolean>; highRisk?: boolean }> = {
  WARN: { permission: "users:warn" }, RESTRICT: { permission: "users:restrict", status: "RESTRICTED" }, SUSPEND: { permission: "users:suspend", status: "SUSPENDED", highRisk: true }, BAN: { permission: "users:ban", status: "BANNED", highRisk: true }, REACTIVATE: { permission: "users:reactivate", status: "ACTIVE", highRisk: true }, DISABLE_DISCOVERY: { permission: "users:restrict", flags: { discovery_disabled: true } }, DISABLE_MESSAGING: { permission: "users:restrict", flags: { messaging_disabled: true } }, DISABLE_UPLOADS: { permission: "users:restrict", flags: { media_uploads_disabled: true } }, REQUEST_REVERIFICATION: { permission: "verification:decide" },
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  const auth = await requireAdminPermission(req, "users:view_basic"); if ("response" in auth) return auth.response;
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "User administration unavailable" }, { status: 503 });
  const sensitive = hasAdminPermission(auth.actor, "users:view_sensitive");
  const fields = sensitive ? "id,auth_id,email,username,display_name,country,city,role,verification_status,verification_level,age_verification_status,age_verification_method,account_status,profile_visibility,created_at,last_active_at,discovery_disabled,messaging_disabled,media_uploads_disabled,restriction_reason,restriction_expires_at" : "id,email,username,display_name,country,city,role,verification_status,account_status,profile_visibility,created_at,last_active_at,discovery_disabled,messaging_disabled,media_uploads_disabled";
  const [profile, against, submitted, blocks, media, actions] = await Promise.all([
    (db as any).from("profiles").select(fields).eq("id", params.id).single(), db.from("moderation_cases").select("id", { count: "exact", head: true }).eq("reported_user_id", params.id), db.from("moderation_cases").select("id", { count: "exact", head: true }).eq("reporter_id", params.id), db.from("user_blocks").select("id", { count: "exact", head: true }).or(`blocker_id.eq.${params.id},blocked_profile_id.eq.${params.id}`), db.from("media_objects").select("id", { count: "exact", head: true }).eq("owner_id", params.id), db.from("admin_action_events").select("id,action,category,reason,created_at,actor_role").eq("resource_type", "USER").eq("resource_id", params.id).order("created_at", { ascending: false }).limit(50),
  ]);
  if (profile.error) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ user: profile.data, counts: { reportsAgainst: against.count || 0, reportsSubmitted: submitted.count || 0, blocks: blocks.count || 0, media: media.count || 0 }, actions: actions.data || [], sensitiveAccess: sensitive }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const definition = ACTIONS[String(body.action || "")];
  if (!definition) return NextResponse.json({ error: "Unsupported account action" }, { status: 400 });
  const auth = await requireAdminPermission(req, definition.permission);
  if ("response" in auth) return auth.response;
  if (auth.actor.profileId === params.id) return NextResponse.json({ error: "Administrators cannot apply privileged account actions to themselves" }, { status: 403 });
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 1000) : "";
  const category = typeof body.category === "string" ? body.category.trim().slice(0, 100) : "";
  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 4000) : null;
  if (!reason || !category) return NextResponse.json({ error: "Reason and category are required" }, { status: 400 });
  if (definition.highRisk && (body.confirmation !== `CONFIRM ${body.action}` || !adminSessionFresh(auth.actor))) return NextResponse.json({ error: "Recent authentication and explicit confirmation are required" }, { status: 409 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "User administration unavailable" }, { status: 503 });
  const { data: before } = await db.from("profiles").select("id,account_status,discovery_disabled,messaging_disabled,media_uploads_disabled,age_verification_status").eq("id", params.id).maybeSingle();
  if (!before) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const update: Record<string, unknown> = { ...(definition.flags || {}), restriction_reason: reason };
  if (definition.status) update.account_status = definition.status;
  if (body.action === "REACTIVATE") Object.assign(update, { discovery_disabled: false, messaging_disabled: false, media_uploads_disabled: false, restriction_reason: null, restriction_expires_at: null });
  if (body.action === "REQUEST_REVERIFICATION") Object.assign(update, { age_verification_status: "REVIEW_REQUIRED" });
  const { data: after, error } = await db.from("profiles").update(update).eq("id", params.id).select("id,account_status,discovery_disabled,messaging_disabled,media_uploads_disabled,age_verification_status").single();
  if (error || !after) return NextResponse.json({ error: "Account action failed" }, { status: 502 });
  const { error: auditError } = await db.from("admin_action_events").insert({ actor_profile_id: auth.actor.profileId, actor_role: auth.actor.role, action: body.action, category, resource_type: "USER", resource_id: params.id, reason, notes, previous_state: before, new_state: after, security_metadata: requestSecurityMetadata(req) });
  if (auditError) return NextResponse.json({ error: "Action applied but audit persistence failed; escalate immediately" }, { status: 502 });
  return NextResponse.json({ user: after });
}
