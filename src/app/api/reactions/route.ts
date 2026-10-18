import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { resolveContentTarget } from "@/lib/content/targetAccess";
import { checkRateLimit } from "@/lib/security/rateLimiter";

// Photo reactions (P1-12): one lightweight like per member per approved photo.
// resolveContentTarget enforces approval, visibility and blocks both ways.
export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const noStore = { "Cache-Control": "private, no-store" };

async function context(req: NextRequest, targetId: unknown) {
  const auth = await resolveServerActor(req);
  if (auth.status !== "authenticated") return { error: NextResponse.json({ error: "Authentication required" }, { status: auth.status === "unauthenticated" ? 401 : 503 }) };
  if (!hasAdultAccess(auth.actor)) return { error: NextResponse.json({ error: "Adult access verification required" }, { status: 403 }) };
  if (typeof targetId !== "string" || !UUID.test(targetId)) return { error: NextResponse.json({ error: "Invalid photo" }, { status: 400 }) };
  const access = await resolveContentTarget(auth.actor, "MEDIA", targetId);
  if (!access.allowed) return { error: NextResponse.json({ error: access.error }, { status: access.status }) };
  return { actor: auth.actor, db: access.db, targetId, isOwner: access.isOwner, ownerId: access.target.ownerId };
}

async function summary(db: NonNullable<Awaited<ReturnType<typeof context>>["db"]>, targetId: string, viewerId: string) {
  const [{ count }, { data: mine }] = await Promise.all([
    db.from("content_reactions").select("id", { count: "exact", head: true }).eq("target_type", "MEDIA").eq("target_id", targetId).eq("reaction", "LIKE"),
    db.from("content_reactions").select("id").eq("target_type", "MEDIA").eq("target_id", targetId).eq("reaction", "LIKE").eq("profile_id", viewerId).maybeSingle(),
  ]);
  return { count: count || 0, liked: Boolean(mine) };
}

export async function GET(req: NextRequest) {
  const ctx = await context(req, new URL(req.url).searchParams.get("mediaId"));
  if ("error" in ctx) return ctx.error;
  return NextResponse.json(await summary(ctx.db, ctx.targetId, ctx.actor.profileId), { headers: noStore });
}

/** Toggle the viewer's like. */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const ctx = await context(req, body.mediaId);
  if ("error" in ctx) return ctx.error;
  const { db, actor, targetId, isOwner, ownerId } = ctx;
  if (isOwner) return NextResponse.json({ error: "You can't like your own photo" }, { status: 400 });
  if (!(await checkRateLimit(`reaction:${actor.userId}`, 120, 60 * 60)).allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const { data: existing } = await db.from("content_reactions").select("id").eq("profile_id", actor.profileId).eq("target_type", "MEDIA").eq("target_id", targetId).eq("reaction", "LIKE").maybeSingle();
  if (existing) {
    const { error } = await db.from("content_reactions").delete().eq("id", existing.id);
    if (error) return NextResponse.json({ error: "Like could not be removed" }, { status: 502 });
  } else {
    const { error } = await db.from("content_reactions").insert({ profile_id: actor.profileId, target_type: "MEDIA", target_id: targetId, reaction: "LIKE" });
    if (error && error.code !== "23505") return NextResponse.json({ error: "Like could not be saved" }, { status: 502 });
    if (!error) {
      const { data: me } = await db.from("profiles").select("display_name,avatar_url").eq("id", actor.profileId).single();
      if (me) await db.from("notifications").insert({ user_id: ownerId, type: "PHOTO_LIKE", title: "Someone liked your photo", message: `${me.display_name} liked your photo.`, actor_name: me.display_name, actor_avatar: me.avatar_url, target_link: `/profile/${actor.profileId}`, is_read: false });
    }
  }
  return NextResponse.json(await summary(db, targetId, actor.profileId), { headers: noStore });
}
