import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";

// Interest (P1-08): a one-tap signal. Mutual interest notifies both members.
export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const noStore = { "Cache-Control": "private, no-store" };

async function context(req: NextRequest, targetId: unknown) {
  const auth = await resolveServerActor(req);
  if (auth.status !== "authenticated") return { error: NextResponse.json({ error: "Authentication required" }, { status: auth.status === "unauthenticated" ? 401 : 503 }) };
  if (!hasAdultAccess(auth.actor)) return { error: NextResponse.json({ error: "Adult access verification required" }, { status: 403 }) };
  if (typeof targetId !== "string" || !UUID.test(targetId) || targetId === auth.actor.profileId) return { error: NextResponse.json({ error: "Invalid member" }, { status: 400 }) };
  const db = getServerSupabase();
  if (!db) return { error: NextResponse.json({ error: "Interest unavailable" }, { status: 503 }) };
  return { auth: auth.actor, db, targetId };
}

async function state(db: NonNullable<ReturnType<typeof getServerSupabase>>, me: string, them: string) {
  const { data } = await db.from("interests").select("from_id,to_id").or(`and(from_id.eq.${me},to_id.eq.${them}),and(from_id.eq.${them},to_id.eq.${me})`);
  const interested = (data || []).some((row) => row.from_id === me);
  const theyAre = (data || []).some((row) => row.from_id === them);
  return { interested, mutual: interested && theyAre };
}

export async function GET(req: NextRequest) {
  const ctx = await context(req, new URL(req.url).searchParams.get("targetProfileId"));
  if ("error" in ctx) return ctx.error;
  return NextResponse.json(await state(ctx.db, ctx.auth.profileId, ctx.targetId), { headers: noStore });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const ctx = await context(req, body.targetProfileId);
  if ("error" in ctx) return ctx.error;
  const { db, auth, targetId } = ctx;
  if (!checkRateLimit(`interest:${auth.userId}`, 60, 60 * 60).allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const [{ data: target }, { data: block, error: blockError }, { data: me }] = await Promise.all([
    db.from("profiles").select("id,display_name,avatar_url,account_status").eq("id", targetId).maybeSingle(),
    db.from("user_blocks").select("id").or(`and(blocker_id.eq.${auth.profileId},blocked_profile_id.eq.${targetId}),and(blocker_id.eq.${targetId},blocked_profile_id.eq.${auth.profileId})`).limit(1).maybeSingle(),
    db.from("profiles").select("display_name,avatar_url").eq("id", auth.profileId).single(),
  ]);
  if (blockError || block || !target || target.account_status !== "ACTIVE" || !me) return NextResponse.json({ error: "Member not available" }, { status: 404 });

  const { data: inserted, error } = await db.from("interests").upsert({ from_id: auth.profileId, to_id: targetId }, { onConflict: "from_id,to_id", ignoreDuplicates: true }).select("from_id");
  if (error) return NextResponse.json({ error: "Interest could not be saved" }, { status: 502 });
  const result = await state(db, auth.profileId, targetId);
  // Notify only on a new signal, never on repeats.
  if (inserted && inserted.length > 0) {
    const notifications = result.mutual
      ? [
          { user_id: targetId, type: "MUTUAL_INTEREST", title: "You're both interested", message: `You and ${me.display_name} are both interested.`, actor_name: me.display_name, actor_avatar: me.avatar_url, target_link: `/profile/${auth.profileId}`, is_read: false },
          { user_id: auth.profileId, type: "MUTUAL_INTEREST", title: "You're both interested", message: `You and ${target.display_name} are both interested.`, actor_name: target.display_name, actor_avatar: target.avatar_url, target_link: `/profile/${targetId}`, is_read: false },
        ]
      : [{ user_id: targetId, type: "INTEREST", title: "Someone is interested", message: `${me.display_name} is interested in you.`, actor_name: me.display_name, actor_avatar: me.avatar_url, target_link: "/activity", is_read: false }];
    const { error: notifyError } = await db.from("notifications").insert(notifications);
    if (notifyError) console.error("Interest notification failed", { code: notifyError.code });
  }
  return NextResponse.json(result, { status: 201, headers: noStore });
}

export async function DELETE(req: NextRequest) {
  const ctx = await context(req, new URL(req.url).searchParams.get("targetProfileId"));
  if ("error" in ctx) return ctx.error;
  const { error } = await ctx.db.from("interests").delete().eq("from_id", ctx.auth.profileId).eq("to_id", ctx.targetId);
  if (error) return NextResponse.json({ error: "Interest could not be removed" }, { status: 502 });
  return NextResponse.json(await state(ctx.db, ctx.auth.profileId, ctx.targetId), { headers: noStore });
}
