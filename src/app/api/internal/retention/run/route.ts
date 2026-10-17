import { NextRequest, NextResponse } from "next/server";
import { anonymizeDeletedProfile } from "@/lib/privacy/retention";
import { isAuthorizedCronRequest } from "@/lib/security/cronAuth";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Retention service unavailable" }, { status: 503 });
  const startedAt = new Date();
  const { data: run, error: runError } = await db.from("retention_runs").insert({ started_at: startedAt.toISOString(), trigger_type: "SCHEDULED", status: "RUNNING" }).select("id").single();
  if (runError || !run) return NextResponse.json({ error: "Retention run could not start" }, { status: 503 });
  const cutoff = new Date(startedAt.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: profiles, error } = await db.from("profiles").select("id").in("account_lifecycle_status", ["DEACTIVATED", "ANONYMIZATION_IN_PROGRESS"]).lte("deactivated_at", cutoff).order("deactivated_at", { ascending: true }).limit(10);
  if (error) {
    await db.from("retention_runs").update({ status: "FAILED", completed_at: new Date().toISOString(), error_summary: "Candidate lookup failed" }).eq("id", run.id);
    return NextResponse.json({ error: "Retention candidate lookup failed" }, { status: 502 });
  }
  const results = [];
  for (const profile of profiles || []) results.push(await anonymizeDeletedProfile(db, run.id, String(profile.id)));
  const failed = results.filter((item) => item.status === "FAILED").length;
  const skipped = results.filter((item) => item.status === "SKIPPED").length;
  const completed = results.filter((item) => item.status === "COMPLETED").length;
  await db.from("retention_runs").update({ status: failed ? "COMPLETED_WITH_ERRORS" : "COMPLETED", completed_at: new Date().toISOString(), processed_count: results.length, completed_count: completed, failed_count: failed, skipped_count: skipped }).eq("id", run.id);
  return NextResponse.json({ runId: run.id, processed: results.length, completed, failed, skipped }, { headers: { "Cache-Control": "no-store" } });
}
