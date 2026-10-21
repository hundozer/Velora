import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { EMAIL_CATEGORIES, verifyUnsubscribeToken } from "@/lib/notifications/returnEmails";

// Signed unsubscribe: GET confirms intent; POST performs it (including one-click clients).
// Works without signing in;
// the signed token proves the link came from an email we sent.
export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function page(title: string, body: string, status = 200) {
  return new NextResponse(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Intimo</title></head><body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0A0B0E;color:#F5F1E8;font-family:system-ui,sans-serif;text-align:center;padding:24px"><main><h1 style="font-family:Georgia,serif;color:#D4AF37">${title}</h1><p style="color:#A8A29A">${body}</p></main></body></html>`, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

export async function GET(req: NextRequest) {
  const params = new URL(req.url).searchParams;
  const profileId = params.get("u") || "";
  const category = params.get("c") || "";
  const token = params.get("t") || "";
  const valid = UUID.test(profileId) && (category === "ALL" || (EMAIL_CATEGORIES as readonly string[]).includes(category)) && verifyUnsubscribeToken(profileId, category, token);
  if (!valid) return page("Link not valid", "This unsubscribe link is invalid or incomplete. You can change emails in Settings.", 400);
  const db = getServerSupabase();
  if (!db) return page("Try again later", "We couldn't update your email settings right now.", 503);
  if (req.method === "GET") return page("Stop these emails?", '<form method="post"><button type="submit" style="padding:14px 24px;font:inherit">Confirm unsubscribe</button></form>');
  const { error } = await db.rpc("intimo_email_opt_out", { p_profile: profileId, p_category: category });
  if (error) return page("Try again later", "We couldn't update your email settings right now.", 503);
  return page("Done", category === "ALL" ? "You won't receive any more Intimo notification emails. Account and security emails still arrive." : "You won't receive these emails any more. Change this any time in Settings.");
}

export const POST = GET;
