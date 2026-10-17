import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/adminApi";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const auth = await requireAdminPermission(req, "users:view_basic");
  if ("response" in auth) return auth.response;
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "User administration unavailable" }, { status: 503 });
  const query = (req.nextUrl.searchParams.get("q") || "").trim().slice(0, 120);
  const status = (req.nextUrl.searchParams.get("status") || "").trim();
  let builder = db.from("profiles").select("id,auth_id,email,username,display_name,country,city,role,verification_status,verification_level,age_verification_status,account_status,profile_visibility,created_at,last_active_at,discovery_disabled,messaging_disabled,media_uploads_disabled").order("created_at", { ascending: false }).limit(100);
  if (query) {
    const safe = query.replaceAll(",", "").replaceAll("(", "").replaceAll(")", "");
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(query);
    builder = builder.or(`${uuid ? `id.eq.${query},` : ""}auth_id.ilike.%${safe}%,email.ilike.%${safe}%,username.ilike.%${safe}%,display_name.ilike.%${safe}%`);
  }
  if (status) builder = builder.eq("account_status", status);
  const { data, error } = await builder;
  if (error) return NextResponse.json({ error: "User search failed" }, { status: 502 });
  return NextResponse.json({ users: data || [] }, { headers: { "Cache-Control": "private, no-store" } });
}
