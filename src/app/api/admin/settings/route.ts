import { NextRequest, NextResponse } from "next/server";
import { adminSessionFresh } from "@/lib/auth/adminAuthorization";
import { requestSecurityMetadata, requireAdminPermission } from "@/lib/auth/adminApi";
import { getServerSupabase } from "@/lib/supabase/server";
export async function GET(req: NextRequest) {
  const auth = await requireAdminPermission(req, "settings:view"); if ("response" in auth) return auth.response;
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Settings unavailable" }, { status: 503 });
  const { data, error } = await db.from("system_feature_flags").select("flag_key,enabled,description,updated_at").order("flag_key"); if (error) return NextResponse.json({ error: "Settings lookup failed" }, { status: 502 });
  return NextResponse.json({ flags: data || [], immutable: ["MONETIZATION_ENABLED"] }, { headers: { "Cache-Control": "private, no-store" } });
}
export async function PATCH(req: NextRequest) {
  const auth = await requireAdminPermission(req, "settings:manage"); if ("response" in auth) return auth.response;
  if (!adminSessionFresh(auth.actor)) return NextResponse.json({ error: "Recent authentication required" }, { status: 409 });
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const key = typeof body.key === "string" ? body.key : ""; const enabled = body.enabled; const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 1000) : "";
  if (!key || typeof enabled !== "boolean" || !reason || body.confirmation !== `CONFIRM ${key}`) return NextResponse.json({ error: "Flag, reason and explicit confirmation are required" }, { status: 400 });
  if (key === "MONETIZATION_ENABLED" && enabled) return NextResponse.json({ error: "Monetization cannot be enabled in the free MVP" }, { status: 403 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Settings unavailable" }, { status: 503 });
  const { data: before } = await db.from("system_feature_flags").select("flag_key,enabled").eq("flag_key", key).maybeSingle(); if (!before) return NextResponse.json({ error: "Unknown feature flag" }, { status: 404 });
  const { error } = await db.from("system_feature_flags").update({ enabled, updated_by: auth.actor.profileId, updated_at: new Date().toISOString() }).eq("flag_key", key); if (error) return NextResponse.json({ error: "Feature flag update failed" }, { status: 502 });
  const { error: auditError } = await db.from("admin_action_events").insert({ actor_profile_id: auth.actor.profileId, actor_role: auth.actor.role, action: "FEATURE_FLAG_CHANGED", category: "SYSTEM_CONFIGURATION", resource_type: "FEATURE_FLAG", resource_id: key, reason, previous_state: { enabled: before.enabled }, new_state: { enabled }, security_metadata: requestSecurityMetadata(req) });
  if (auditError) return NextResponse.json({ error: "Feature flag audit failed" }, { status: 502 });
  return NextResponse.json({ success: true });
}
