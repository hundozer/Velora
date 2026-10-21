import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { authorizedUnreadWorker, dispatchUnreadEmails } from "@/lib/notifications/unreadEmailWorker";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!authorizedUnreadWorker(req.headers.get("authorization"))) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (process.env.INTIMO_UNREAD_EMAIL_ENABLED !== "true" || !process.env.RESEND_API_KEY) return NextResponse.json({ error: "Email worker unavailable" }, { status: 503 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Email worker unavailable" }, { status: 503 });
  try {
    return NextResponse.json(await dispatchUnreadEmails(db), { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Email queue unavailable" }, { status: 503 }); }
}
