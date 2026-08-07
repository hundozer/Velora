import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { inspectStoredObject } from "@/lib/storage/r2";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  if (!UUID.test(params.id)) return NextResponse.json({ error: "Invalid media identifier" }, { status: 400 });
  if (!checkRateLimit(`media-complete:${actor.actor.auth0Sub}`, 30, 60).allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Media service unavailable" }, { status: 503 });
  const { data: media, error } = await supabase.from("media_objects").select("id,owner_id,object_key,mime_type,byte_size,upload_status").eq("id", params.id).eq("owner_id", actor.actor.profileId).single();
  if (error || !media) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  if (media.upload_status === "AVAILABLE") return NextResponse.json({ success: true });
  if (media.upload_status !== "PENDING") return NextResponse.json({ error: "Media cannot be finalized" }, { status: 409 });
  try {
    const stored = await inspectStoredObject(media.object_key);
    if (!stored || stored.byteSize !== Number(media.byte_size) || stored.mimeType.toLowerCase() !== String(media.mime_type).toLowerCase()) {
      await supabase.from("media_objects").update({ upload_status: "QUARANTINED", updated_at: new Date().toISOString() }).eq("id", media.id).eq("owner_id", actor.actor.profileId);
      return NextResponse.json({ error: "Stored object did not match the authorized upload" }, { status: 422 });
    }
    const { error: updateError } = await supabase.from("media_objects").update({ upload_status: "AVAILABLE", updated_at: new Date().toISOString() }).eq("id", media.id).eq("owner_id", actor.actor.profileId).eq("upload_status", "PENDING");
    if (updateError) return NextResponse.json({ error: "Upload could not be finalized" }, { status: 502 });
    await supabase.from("audit_events").insert({ actor_profile_id: actor.actor.profileId, actor_auth0_sub: actor.actor.auth0Sub, action: "MEDIA_UPLOAD_COMPLETED", resource_type: "MEDIA", resource_id: media.id, outcome: "SUCCESS", metadata: { mimeType: media.mime_type, byteSize: media.byte_size } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Stored object could not be verified" }, { status: 502 });
  }
}
