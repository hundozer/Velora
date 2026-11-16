import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/adminApi";
import { getServerSupabase } from "@/lib/supabase/server";
import { founderMetrics } from "@/lib/admin/founderMetrics.mjs";

export const dynamic = "force-dynamic";
const LIMIT = 10_000;
// PostgREST returns at most 1,000 rows per request by default, whatever .limit() asks for.
const PAGE = 1_000;

type Db = NonNullable<ReturnType<typeof getServerSupabase>>;

/**
 * Reads up to LIMIT rows in pages with a stable order, and reports truncation by
 * comparing what came back with the table's exact count.
 */
async function readAll(db: Db, table: string, columns: string, since?: string) {
  const rows: Record<string, unknown>[] = [];
  let total: number | null = null;
  for (let from = 0; from < LIMIT; from += PAGE) {
    let query = db.from(table).select(columns, { count: from === 0 ? "exact" : undefined }).order("created_at", { ascending: true }).range(from, from + PAGE - 1);
    if (since) query = query.gte("created_at", since);
    const { data, error, count } = await query;
    if (error) return { error };
    if (from === 0) total = count ?? null;
    rows.push(...((data || []) as unknown as Record<string, unknown>[]));
    if (!data || data.length < PAGE) break;
  }
  return { rows, truncated: total !== null ? total > rows.length : rows.length >= LIMIT };
}

/** FM-04 founding numbers: aggregate counts for MFA admins. Never returns member rows. */
export async function GET(req: NextRequest) {
  const auth = await requireAdminPermission(req, "users:view_sensitive");
  if ("response" in auth) return auth.response;
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Admin data service unavailable" }, { status: 503 });
  const [profiles, requests, invites, reports] = await Promise.all([
    readAll(db, "profiles", "created_at,last_active_at,gender,is_couple_profile,verification_status,account_status,account_lifecycle_status,membership_level,is_demo"),
    readAll(db, "invitation_requests", "identity,status,created_at"),
    readAll(db, "member_email_invites", "status,created_at,sent_at,redeemed_at,expires_at"),
    readAll(db, "moderation_cases", "created_at", new Date(Date.now() - 90 * 86_400_000).toISOString()),
  ]);
  if ([profiles, requests, invites, reports].some((result) => "error" in result)) return NextResponse.json({ error: "Numbers could not be loaded" }, { status: 502 });
  const ok = (result: typeof profiles) => result as { rows: Record<string, unknown>[]; truncated: boolean };
  const metrics = founderMetrics({ profiles: ok(profiles).rows, requests: ok(requests).rows, invites: ok(invites).rows, reports: ok(reports).rows });
  const truncated = [profiles, requests, invites, reports].some((result) => ok(result).truncated);
  return NextResponse.json({ metrics, truncated }, { headers: { "Cache-Control": "private, no-store" } });
}
