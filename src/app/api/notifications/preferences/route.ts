import { NextRequest, NextResponse } from "next/server";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { EMAIL_CATEGORIES } from "@/lib/notifications/returnEmails";

// Email preferences (P1-11): the categories a member has opted out of.
export const dynamic = "force-dynamic";
const ALLOWED = new Set<string>([...EMAIL_CATEGORIES, "ALL"]);

export async function GET(req: NextRequest) {
  const auth = await resolveServerActor(req);
  if (auth.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: auth.status === "unauthenticated" ? 401 : 503 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Preferences unavailable" }, { status: 503 });
  const { data, error } = await db.from("profiles").select("email_opt_out").eq("id", auth.actor.profileId).maybeSingle();
  if (error) return NextResponse.json({ error: "Preferences lookup failed" }, { status: 502 });
  return NextResponse.json({ optOut: data?.email_opt_out || [] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PUT(req: NextRequest) {
  const auth = await resolveServerActor(req);
  if (auth.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: auth.status === "unauthenticated" ? 401 : 503 });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const optOut = Array.isArray(body.optOut) ? [...new Set(body.optOut.filter((value): value is string => typeof value === "string" && ALLOWED.has(value)))] : null;
  if (!optOut) return NextResponse.json({ error: "Invalid preferences" }, { status: 400 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Preferences unavailable" }, { status: 503 });
  const { error } = await db.from("profiles").update({ email_opt_out: optOut }).eq("id", auth.actor.profileId);
  if (error) return NextResponse.json({ error: "Preferences could not be saved" }, { status: 502 });
  return NextResponse.json({ optOut }, { headers: { "Cache-Control": "private, no-store" } });
}
