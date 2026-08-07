import { NextRequest, NextResponse } from "next/server";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { auditLogger } from "@/lib/auth/auditLogger";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!uuid.test(params.id)) return NextResponse.json({ error: "Invalid ad identifier" }, { status: 400 });
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Dating ads unavailable" }, { status: 503 });
  const { data, error } = await supabase.from("dating_ads").delete().eq("id", params.id).eq("author_id", actor.actor.profileId).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Dating ad deletion failed" }, { status: 502 });
  if (!data) return NextResponse.json({ error: "Dating ad not found" }, { status: 404 });
  auditLogger.logEvent({ actorId: actor.actor.auth0Sub, actorRole: actor.actor.role as any, action: "DATING_AD_DELETE", resourceId: params.id, resourceType: "DATING_AD", status: "SUCCESS" });
  return NextResponse.json({ success: true });
}
