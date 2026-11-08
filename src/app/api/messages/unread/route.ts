import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";

// Unread indicators for the mobile tab bar: whether Messages and You have
// something new. Same rules as the inbox: blocked or inactive senders don't count.
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };

export async function GET(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(actor.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Messaging unavailable" }, { status: 503 });
  const me = actor.actor.profileId;

  const [unread, blocks, notices] = await Promise.all([
    db.from("direct_messages").select("sender_id").eq("receiver_id", me).eq("is_opened", false).eq("status", "SENT").limit(500),
    db.from("user_blocks").select("blocker_id,blocked_profile_id").or(`blocker_id.eq.${me},blocked_profile_id.eq.${me}`),
    // Message notifications are already shown on Messages, so You counts the rest.
    db.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", me).eq("is_read", false).neq("type", "NEW_MESSAGE"),
  ]);
  if (unread.error || blocks.error || notices.error) return NextResponse.json({ error: "Unread lookup failed" }, { status: 502 });

  const blocked = new Set((blocks.data || []).map((block) => (block.blocker_id === me ? block.blocked_profile_id : block.blocker_id)));
  const senderIds = [...new Set((unread.data || []).map((row) => row.sender_id as string))].filter((id) => !blocked.has(id));
  let messages = 0;
  if (senderIds.length) {
    const { data: senders, error } = await db.from("profiles").select("id").in("id", senderIds).eq("account_status", "ACTIVE").eq("is_demo", false);
    if (error) return NextResponse.json({ error: "Unread lookup failed" }, { status: 502 });
    const active = new Set((senders || []).map((sender) => sender.id as string));
    messages = (unread.data || []).filter((row) => active.has(row.sender_id as string)).length;
  }
  return NextResponse.json({ messages, notifications: notices.count || 0 }, { headers: noStore });
}
