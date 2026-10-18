import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/adminApi";
import { getServerSupabase } from "@/lib/supabase/server";

// Review queues at a glance (P1-18): size and age of the oldest item against its target.
export const dynamic = "force-dynamic";
const HOUR = 3_600_000;
const OPEN_STATUSES = ["OPEN", "UNDER_REVIEW", "ACTION_REQUIRED", "ESCALATED", "APPEALED"];
const URGENT_REASONS = ["SUSPECTED_MINOR", "NON_CONSENSUAL_INTIMATE_CONTENT", "EXPLOITATION_TRAFFICKING"];

export async function GET(req: NextRequest) {
  const guard = await requireAdminPermission(req, "moderation:view");
  if ("response" in guard) return guard.response;
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Queues unavailable" }, { status: 503 });
  const oldest = async (table: string, filter: (query: any) => any) => {
    const { data, count, error } = await filter(db.from(table).select("created_at", { count: "exact" })).order("created_at", { ascending: true }).limit(1);
    if (error) return { count: null, oldestHours: null };
    return { count: count ?? 0, oldestHours: data?.[0] ? Math.round(((Date.now() - new Date(data[0].created_at).getTime()) / HOUR) * 10) / 10 : null };
  };
  const [photos, plans, scene, reports, urgent] = await Promise.all([
    oldest("media_objects", (query) => query.eq("moderation_status", "PENDING_REVIEW").eq("upload_status", "AVAILABLE").or("category.is.null,category.neq.MESSAGE")),
    oldest("dating_ads", (query) => query.eq("moderation_status", "PENDING_REVIEW").eq("status", "active")),
    oldest("scene_events", (query) => query.eq("status", "PENDING_REVIEW")),
    oldest("moderation_cases", (query) => query.in("status", OPEN_STATUSES)),
    oldest("moderation_cases", (query) => query.in("status", OPEN_STATUSES).in("reason", URGENT_REASONS)),
  ]);
  // Targets from SECURITY_AND_MODERATION.md: underage/non-consensual < 1 h, everything else < 12 h.
  const queues = [
    { id: "urgent", label: "Urgent reports (underage, non-consensual)", targetHours: 1, href: "/admin/moderation", ...urgent },
    { id: "reports", label: "All open reports", targetHours: 12, href: "/admin/moderation", ...reports },
    { id: "photos", label: "Photos awaiting review", targetHours: 12, href: "/admin/content", ...photos },
    { id: "plans", label: "Plans awaiting review", targetHours: 12, href: "/admin/plans", ...plans },
    { id: "scene", label: "Scene suggestions", targetHours: 48, href: "/admin/scene", ...scene },
  ];
  return NextResponse.json({ queues }, { headers: { "Cache-Control": "private, no-store" } });
}
