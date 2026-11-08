import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";

// Lets /register say up front whether an invitation link still works, before anyone
// types an email or password. Returns only the link's state: never the inviter,
// the invited address or any date. Joining is still enforced at sign-up and at
// profile creation (/api/auth/email, /api/profile/me).
export const dynamic = "force-dynamic";
const TOKEN = /^[a-zA-Z0-9_-]{43}$/;
const reply = (state: "valid" | "expired" | "used" | "invalid", status = 200) =>
  NextResponse.json({ state }, { status, headers: { "Cache-Control": "private, no-store" } });

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("invite") || "";
  if (!TOKEN.test(token)) return reply("invalid");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await checkRateLimit(`invite-check:${ip}`, 30, 60 * 60)).allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Invitation checks are unavailable" }, { status: 503 });
  const hash = createHash("sha256").update(token).digest("hex");
  const { data, error } = await db.from("member_email_invites").select("status,expires_at").eq("token_sha256", hash).maybeSingle();
  if (error) return NextResponse.json({ error: "Invitation checks are unavailable" }, { status: 503 });
  if (!data) return reply("invalid");
  if (data.status === "REDEEMED") return reply("used");
  if (data.status !== "SENT") return reply("invalid");
  if (!data.expires_at || new Date(data.expires_at).getTime() <= Date.now()) return reply("expired");
  return reply("valid");
}
