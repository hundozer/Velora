import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/adminApi";
import { getServerSupabase } from "@/lib/supabase/server";
import { founderMetrics } from "@/lib/admin/founderMetrics.mjs";

export const dynamic = "force-dynamic";
const LIMIT = 10_000;

/** FM-04 founding numbers: aggregate counts for MFA admins. Never returns member rows. */
export async function GET(req: NextRequest) {
  const auth = await requireAdminPermission(req, "users:view_sensitive");
  if ("response" in auth) return auth.response;
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Admin data service unavailable" }, { status: 503 });
  const [profiles, requests, invites, reports] = await Promise.all([
    db.from("profiles").select("created_at,last_active_at,gender,is_couple_profile,verification_status,account_status,account_lifecycle_status,membership_level,is_demo").limit(LIMIT),
    db.from("invitation_requests").select("identity,status,created_at").limit(LIMIT),
    db.from("member_email_invites").select("status,created_at,sent_at,redeemed_at,expires_at").limit(LIMIT),
    db.from("moderation_cases").select("created_at").gte("created_at", new Date(Date.now() - 90 * 86_400_000).toISOString()).limit(LIMIT),
  ]);
  if ([profiles, requests, invites, reports].some((result) => result.error)) return NextResponse.json({ error: "Numbers could not be loaded" }, { status: 502 });
  const metrics = founderMetrics({ profiles: profiles.data || [], requests: requests.data || [], invites: invites.data || [], reports: reports.data || [] });
  const truncated = [profiles, requests, invites, reports].some((result) => (result.data?.length || 0) >= LIMIT);
  return NextResponse.json({ metrics, truncated }, { headers: { "Cache-Control": "private, no-store" } });
}
