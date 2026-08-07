import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/adminApi";
import { getServerSupabase } from "@/lib/supabase/server";
export async function GET(req: NextRequest) {
  const auth = await requireAdminPermission(req, "audit:view"); if ("response" in auth) return auth.response;
  const db = getServerSupabase(); if (!db) return NextResponse.json({ error: "Audit service unavailable" }, { status: 503 });
  const { data, error } = await db.from("admin_action_events").select("id,actor_profile_id,actor_role,action,category,resource_type,resource_id,reason,notes,previous_state,new_state,created_at").order("created_at", { ascending: false }).limit(500);
  if (error) return NextResponse.json({ error: "Audit log lookup failed" }, { status: 502 });
  return NextResponse.json({ events: data || [] }, { headers: { "Cache-Control": "private, no-store" } });
}
