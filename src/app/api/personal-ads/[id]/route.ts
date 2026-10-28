import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { appendDurableAudit } from "@/lib/auth/durableAudit";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Invalid ad" }, { status: 400 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Dating ads unavailable" }, { status: 503 });
  const { data, error } = await db.from("personal_ads").update({ status: "CLOSED", updated_at: new Date().toISOString() }).eq("id", params.id).eq("author_id", actor.actor.profileId).eq("status", "ACTIVE").select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Ad could not be closed" }, { status: 502 });
  if (!data) return NextResponse.json({ error: "Ad not found or already closed" }, { status: 404 });
  const audited = await appendDurableAudit(db, { actorProfileId: actor.actor.profileId, actorUserId: actor.actor.userId, action: "PERSONAL_AD_CLOSE", resourceType: "PERSONAL_AD", resourceId: data.id, outcome: "SUCCESS" });
  if (!audited) return NextResponse.json({ error: "Ad closed but audit recording failed; contact support" }, { status: 503 });
  return NextResponse.json({ closed: true }, { headers: { "Cache-Control": "private, no-store" } });
}
