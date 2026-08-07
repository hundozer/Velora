import { NextRequest, NextResponse } from "next/server";
import { adminSessionFresh } from "@/lib/auth/adminAuthorization";
import { requestSecurityMetadata, requireAdminPermission } from "@/lib/auth/adminApi";
import { clearGodModeCookie, GOD_MODE_COOKIE, GOD_MODE_TTL_SECONDS, hashGodModeToken, newGodModeToken, requireGodMode, setGodModeCookie } from "@/lib/auth/godMode";
import { getServerSupabase } from "@/lib/supabase/server";
import { decryptTotpSecret, verifyTotp } from "@/lib/auth/adminTotp";

export async function GET(req: NextRequest) {
  const god = await requireGodMode(req); if ("response" in god) return god.response;
  return NextResponse.json({ active: true, expiresInSeconds: GOD_MODE_TTL_SECONDS, role: god.actor.role }, { headers: { "Cache-Control": "private, no-store" } });
}
export async function POST(req: NextRequest) {
  const auth = await requireAdminPermission(req, "dashboard:view"); if ("response" in auth) return auth.response;
  if (auth.actor.role !== "SUPER_ADMIN" || !auth.actor.emailVerified) return NextResponse.json({ error: "SUPER_ADMIN authorization and verified email required" }, { status: 403 });
  if (!adminSessionFresh(auth.actor, 5 * 60)) return NextResponse.json({ error: "Recent Auth0 authentication required" }, { status: 409 });
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 1000) : "";
  if (!reason || body.confirmation !== "ENTER GOD MODE") return NextResponse.json({ error: "Reason and exact confirmation are required" }, { status: 400 });
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Elevation service unavailable" }, { status: 503 });
  const { data: mfa } = await db.from("admin_mfa_credentials").select("encrypted_secret,status,failed_attempts,locked_until").eq("profile_id", auth.actor.profileId).maybeSingle();
  if (!mfa || mfa.status !== "ACTIVE") return NextResponse.json({ error: "Authenticator enrollment required" }, { status: 403 });
  if (mfa.locked_until && new Date(mfa.locked_until).getTime() > Date.now()) return NextResponse.json({ error: "Too many authenticator attempts; try again later" }, { status: 429 });
  const mfaCode = typeof body.mfaCode === "string" ? body.mfaCode.trim() : "";
  if (!verifyTotp(decryptTotpSecret(mfa.encrypted_secret), mfaCode)) {
    const attempts = Number(mfa.failed_attempts || 0) + 1;
    await db.from("admin_mfa_credentials").update({ failed_attempts: attempts >= 5 ? 0 : attempts, locked_until: attempts >= 5 ? new Date(Date.now() + 15 * 60_000).toISOString() : null, updated_at: new Date().toISOString() }).eq("profile_id", auth.actor.profileId);
    return NextResponse.json({ error: "A fresh valid authenticator code is required" }, { status: 401 });
  }
  await db.from("admin_mfa_credentials").update({ failed_attempts: 0, locked_until: null, updated_at: new Date().toISOString() }).eq("profile_id", auth.actor.profileId);
  const token = newGodModeToken(); const now = new Date(); const expires = new Date(now.getTime() + GOD_MODE_TTL_SECONDS * 1000);
  const { data: session, error } = await db.from("elevated_admin_sessions").insert({ profile_id: auth.actor.profileId, token_hash: hashGodModeToken(token), reason, expires_at: expires.toISOString() }).select("id").single();
  if (error || !session) return NextResponse.json({ error: "God Mode could not be entered" }, { status: 502 });
  const { error: auditError } = await db.from("admin_action_events").insert({ actor_profile_id: auth.actor.profileId, actor_role: "SUPER_ADMIN", action: "GOD_MODE_ENTERED", category: "ELEVATION", resource_type: "ELEVATED_ADMIN_SESSION", resource_id: session.id, reason, previous_state: { active: false }, new_state: { active: true, expiresAt: expires.toISOString() }, security_metadata: requestSecurityMetadata(req) });
  if (auditError) { await db.from("elevated_admin_sessions").update({ revoked_at: now.toISOString(), revoked_reason: "Audit persistence failed" }).eq("id", session.id); return NextResponse.json({ error: "God Mode audit failed" }, { status: 502 }); }
  const response = NextResponse.json({ active: true, expiresAt: expires.toISOString() }); setGodModeCookie(response, token); return response;
}
export async function DELETE(req: NextRequest) {
  const auth = await requireAdminPermission(req, "dashboard:view"); if ("response" in auth) return auth.response;
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Elevation service unavailable" }, { status: 503 });
  const token = req.cookies.get(GOD_MODE_COOKIE)?.value; const now = new Date().toISOString();
  if (token) await db.from("elevated_admin_sessions").update({ revoked_at: now, revoked_reason: "SUPER_ADMIN exited God Mode" }).eq("token_hash", hashGodModeToken(token)).eq("profile_id", auth.actor.profileId);
  await db.from("admin_action_events").insert({ actor_profile_id: auth.actor.profileId, actor_role: auth.actor.role, action: "GOD_MODE_EXITED", category: "ELEVATION", resource_type: "ADMIN_PROFILE", resource_id: auth.actor.profileId, reason: "SUPER_ADMIN explicitly exited God Mode", previous_state: { active: true }, new_state: { active: false }, security_metadata: requestSecurityMetadata(req) });
  const response = NextResponse.json({ active: false }); clearGodModeCookie(response); return response;
}
