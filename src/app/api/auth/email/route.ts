import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { safeReturnTo } from "@/lib/auth/accountState.mjs";
import { ResendClient } from "@/lib/notifications/resendClient";
import { authEmail } from "@/lib/notifications/authEmails";

export const dynamic = "force-dynamic";

/**
 * Sends every auth email (sign-up confirmation, sign-in link, password reset)
 * from Intimo through Resend. Links carry a Supabase token hash verified by
 * /auth/confirm, so they work on any device and need no Supabase redirect or
 * SMTP configuration. Responses never reveal whether an account exists.
 */
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
const ACCEPTED = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });

function appOrigin(req: NextRequest) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return configured && /^https?:\/\//.test(configured) ? configured.replace(/\/$/, "") : new URL(req.url).origin;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const action = body.action;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL.test(email) || !["signup", "magiclink", "recovery"].includes(String(action))) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const perEmail = checkRateLimit(`auth-email:${email}`, 5, 60 * 60);
  const perIp = checkRateLimit(`auth-email-ip:${ip}`, 20, 60 * 60);
  if (!perEmail.allowed || !perIp.allowed) {
    return NextResponse.json({ error: "Too many emails requested. Try again later." }, { status: 429 });
  }
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Sign-in is temporarily unavailable" }, { status: 503 });

  const origin = appOrigin(req);
  const next = safeReturnTo(body.next) || (action === "recovery" ? "/update-password" : "/onboarding");
  const link = (hash: string, type: "signup" | "magiclink" | "recovery") =>
    `${origin}/auth/confirm?token_hash=${encodeURIComponent(hash)}&type=${type}&next=${encodeURIComponent(next)}`;

  try {
    if (action === "signup") {
      const password = typeof body.password === "string" ? body.password : "";
      if (password.length < 10 || password.length > 128) return NextResponse.json({ error: "Use a password of at least 10 characters" }, { status: 400 });
      if (body.adult !== true || body.terms !== true) return NextResponse.json({ error: "Confirm you are 18+ and accept the terms" }, { status: 400 });
      const { data, error } = await db.auth.admin.generateLink({ type: "signup", email, password });
      if (!error && data?.properties?.hashed_token) {
        await ResendClient.sendEmail({ to: email, ...authEmail("confirm", link(data.properties.hashed_token, "signup")) });
        return ACCEPTED;
      }
      // Already registered: send a sign-in link instead, without disclosing that fact.
      if (error?.status !== 422 && !/registered|exists/i.test(error?.message || "")) throw error;
    }

    if (action === "recovery") {
      const { data, error } = await db.auth.admin.generateLink({ type: "recovery", email });
      if (!error && data?.properties?.hashed_token) {
        await ResendClient.sendEmail({ to: email, ...authEmail("recovery", link(data.properties.hashed_token, "recovery")) });
      }
      return ACCEPTED;
    }

    // magiclink (also used for "resend confirmation" and the already-registered case).
    // Verifying a magic link confirms the address; for a new address it creates a passwordless account.
    const { data, error } = await db.auth.admin.generateLink({ type: "magiclink", email });
    if (error || !data?.properties?.hashed_token) throw error || new Error("No link generated");
    await ResendClient.sendEmail({ to: email, ...authEmail("signin", link(data.properties.hashed_token, "magiclink")) });
    return ACCEPTED;
  } catch (error) {
    console.error("Auth email failed", { action, status: (error as { status?: number })?.status });
    return NextResponse.json({ error: "We couldn't send the email. Try again shortly." }, { status: 502 });
  }
}
