import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/adminApi";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireAdminPermission(req, "dashboard:view");
  if ("response" in auth) return auth.response;
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Admin data service unavailable" }, { status: 503 });
  const now = Date.now();
  const [cases, privacy, verification, users, recent] = await Promise.all([
    db.from("moderation_cases").select("id,priority,status,reason,content_type,created_at,assigned_moderator").neq("status", "RESOLVED").neq("status", "REJECTED").order("created_at", { ascending: true }).limit(250),
    db.from("privacy_requests").select("id,request_type,status,requested_at,due_at,assigned_admin_id").neq("status", "COMPLETED").limit(250),
    db.from("verification_reviews").select("id,verification_type,status,submitted_at").in("status", ["PENDING", "REVIEW_REQUIRED", "FAILED"]).limit(250),
    db.from("profiles").select("id,created_at,verification_status,account_status,last_active_at").limit(1000),
    db.from("admin_action_events").select("id,action,resource_type,resource_id,actor_role,reason,created_at").order("created_at", { ascending: false }).limit(12),
  ]);
  if ([cases, privacy, verification, users, recent].some((result) => result.error)) return NextResponse.json({ error: "Admin overview could not be loaded" }, { status: 502 });
  const openCases = cases.data || [];
  const privacyItems = privacy.data || [];
  const verificationItems = verification.data || [];
  const userItems = users.data || [];
  const oldestCritical = openCases.filter((item) => item.priority === "CRITICAL").map((item) => new Date(item.created_at).getTime()).sort()[0];
  return NextResponse.json({
    actor: { role: auth.actor.role, email: auth.actor.email, mfaAuthenticated: auth.actor.mfaAuthenticated },
    critical: { count: openCases.filter((item) => item.priority === "CRITICAL").length, unassigned: openCases.filter((item) => item.priority === "CRITICAL" && !item.assigned_moderator).length, oldestHours: oldestCritical ? Math.floor((now - oldestCritical) / 3_600_000) : 0, cases: openCases.filter((item) => item.priority === "CRITICAL").slice(0, 8) },
    moderation: { open: openCases.filter((item) => item.status === "OPEN").length, underReview: openCases.filter((item) => item.status === "UNDER_REVIEW").length, escalated: openCases.filter((item) => item.status === "ESCALATED").length, appealed: openCases.filter((item) => item.status === "APPEALED").length, unassigned: openCases.filter((item) => !item.assigned_moderator).length },
    privacy: { open: privacyItems.length, deletion: privacyItems.filter((item) => item.request_type === "DELETION").length, overdue: privacyItems.filter((item) => item.due_at && new Date(item.due_at).getTime() < now).length },
    verification: { pending: verificationItems.filter((item) => item.status === "PENDING").length, reviewRequired: verificationItems.filter((item) => item.status === "REVIEW_REQUIRED").length, failed: verificationItems.filter((item) => item.status === "FAILED").length },
    health: { registeredUsers: userItems.length, newRegistrations7d: userItems.filter((item) => new Date(item.created_at).getTime() > now - 604_800_000).length, verifiedUsers: userItems.filter((item) => item.verification_status === "VERIFIED" || item.verification_status === "IDENTITY_VERIFIED").length, restrictedUsers: userItems.filter((item) => item.account_status && item.account_status !== "ACTIVE").length },
    recentActivity: recent.data || [],
  }, { headers: { "Cache-Control": "private, no-store" } });
}
