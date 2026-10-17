import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { AdminPermission } from "./adminAuthorization";
import { requireAdminPermission } from "./adminApi";
import { getServerSupabase } from "@/lib/supabase/server";

export const GOD_MODE_COOKIE = "intimo_god_mode";
export const GOD_MODE_TTL_SECONDS = 15 * 60;
export const hashGodModeToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const newGodModeToken = () => randomBytes(32).toString("base64url");

export async function requireGodMode(req: NextRequest, permission: AdminPermission = "dashboard:view") {
  const auth = await requireAdminPermission(req, permission);
  if ("response" in auth) return auth;
  if (auth.actor.role !== "SUPER_ADMIN" || !auth.actor.emailVerified) return { response: NextResponse.json({ error: "SUPER_ADMIN authorization and verified email required" }, { status: 403 }) } as const;
  const token = req.cookies.get(GOD_MODE_COOKIE)?.value;
  if (!token) return { response: NextResponse.json({ error: "God Mode elevation required", code: "GOD_MODE_REQUIRED" }, { status: 403 }) } as const;
  const db = getServerSupabase(); if (!db) return { response: NextResponse.json({ error: "Elevation service unavailable" }, { status: 503 }) } as const;
  const { data: session } = await db.from("elevated_admin_sessions").select("id,profile_id,expires_at,revoked_at").eq("token_hash", hashGodModeToken(token)).eq("profile_id", auth.actor.profileId).maybeSingle();
  if (!session || session.revoked_at || new Date(session.expires_at).getTime() <= Date.now()) return { response: NextResponse.json({ error: "God Mode session expired", code: "GOD_MODE_EXPIRED" }, { status: 403 }) } as const;
  await db.from("elevated_admin_sessions").update({ last_used_at: new Date().toISOString() }).eq("id", session.id);
  return { actor: auth.actor, elevatedSessionId: session.id } as const;
}

export function setGodModeCookie(response: NextResponse, token: string) {
  response.cookies.set(GOD_MODE_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: GOD_MODE_TTL_SECONDS });
}
export function clearGodModeCookie(response: NextResponse) { response.cookies.set(GOD_MODE_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 }); }
