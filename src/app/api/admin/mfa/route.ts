import { NextRequest, NextResponse } from "next/server";
import { decryptTotpSecret, encryptTotpSecret, newTotpSecret, totpUri, verifyTotp } from "@/lib/auth/adminTotp";
import { ADMIN_MFA_TTL_SECONDS, hashAdminMfaToken, newAdminMfaToken, setAdminMfaCookie } from "@/lib/auth/adminMfaSession";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";

async function adminIdentity(req: NextRequest) {
  const result = await resolveServerActor(req);
  return result.status === "authenticated" && result.actor.adminAuthorized ? result.actor : null;
}

export async function GET(req: NextRequest) {
  const actor = await adminIdentity(req);
  if (!actor) return NextResponse.json({ error: "Administrator authentication required" }, { status: 401 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "MFA service unavailable" }, { status: 503 });
  const { data } = await db.from("admin_mfa_credentials").select("encrypted_secret,status").eq("profile_id", actor.profileId).maybeSingle();
  if (data?.status === "ACTIVE") return NextResponse.json({ enrolled: true });
  const secret = data ? decryptTotpSecret(data.encrypted_secret) : newTotpSecret();
  if (!data) {
    const { error } = await db.from("admin_mfa_credentials").insert({ profile_id: actor.profileId, encrypted_secret: encryptTotpSecret(secret), status: "PENDING" });
    if (error) return NextResponse.json({ error: "MFA enrollment could not start" }, { status: 502 });
  }
  return NextResponse.json({ enrolled: false, secret, uri: totpUri(secret, actor.email || actor.auth0Sub) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: NextRequest) {
  const actor = await adminIdentity(req);
  if (!actor) return NextResponse.json({ error: "Administrator authentication required" }, { status: 401 });
  let body: { code?: unknown }; try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "MFA service unavailable" }, { status: 503 });
  const { data } = await db.from("admin_mfa_credentials").select("encrypted_secret,status,failed_attempts,locked_until").eq("profile_id", actor.profileId).maybeSingle();
  if (!data || data.status === "REVOKED") return NextResponse.json({ error: "MFA enrollment required" }, { status: 409 });
  if (data.locked_until && new Date(data.locked_until).getTime() > Date.now()) return NextResponse.json({ error: "Too many attempts; try again later" }, { status: 429 });
  if (!verifyTotp(decryptTotpSecret(data.encrypted_secret), code)) {
    const attempts = Number(data.failed_attempts || 0) + 1;
    await db.from("admin_mfa_credentials").update({ failed_attempts: attempts >= 5 ? 0 : attempts, locked_until: attempts >= 5 ? new Date(Date.now() + 15 * 60_000).toISOString() : null, updated_at: new Date().toISOString() }).eq("profile_id", actor.profileId);
    return NextResponse.json({ error: "Invalid authenticator code" }, { status: 401 });
  }
  const now = new Date();
  await db.from("admin_mfa_credentials").update({ status: "ACTIVE", failed_attempts: 0, locked_until: null, enrolled_at: data.status === "PENDING" ? now.toISOString() : undefined, updated_at: now.toISOString() }).eq("profile_id", actor.profileId);
  const token = newAdminMfaToken();
  const expires = new Date(now.getTime() + ADMIN_MFA_TTL_SECONDS * 1000);
  const { error } = await db.from("admin_mfa_sessions").insert({ profile_id: actor.profileId, token_hash: hashAdminMfaToken(token), expires_at: expires.toISOString() });
  if (error) return NextResponse.json({ error: "MFA session could not be created" }, { status: 502 });
  const response = NextResponse.json({ verified: true, expiresAt: expires.toISOString() });
  setAdminMfaCookie(response, token);
  return response;
}
