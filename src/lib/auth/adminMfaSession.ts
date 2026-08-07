import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export const ADMIN_MFA_COOKIE = "intimo_admin_mfa";
export const ADMIN_MFA_TTL_SECONDS = 30 * 60;
export const hashAdminMfaToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const newAdminMfaToken = () => randomBytes(32).toString("base64url");

export async function hasValidAdminMfaSession(profileId: string, req?: NextRequest): Promise<boolean> {
  const token = req?.cookies.get(ADMIN_MFA_COOKIE)?.value || cookies().get(ADMIN_MFA_COOKIE)?.value;
  if (!token) return false;
  const db = getServerSupabase();
  if (!db) return false;
  const { data } = await db.from("admin_mfa_sessions").select("id,expires_at,revoked_at").eq("profile_id", profileId).eq("token_hash", hashAdminMfaToken(token)).maybeSingle();
  if (!data || data.revoked_at || new Date(data.expires_at).getTime() <= Date.now()) return false;
  await db.from("admin_mfa_sessions").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);
  return true;
}

export function setAdminMfaCookie(response: NextResponse, token: string) {
  response.cookies.set(ADMIN_MFA_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: ADMIN_MFA_TTL_SECONDS });
}
