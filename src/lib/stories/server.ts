import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
export const storyHeaders = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, noarchive" };
export const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const storyJson = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: storyHeaders });
export async function storyActor(req: NextRequest) {
 const auth = await resolveServerActor(req);
 if (auth.status !== "authenticated") return { ok: false as const, response: storyJson({ error: "Sign in to see stories" }, auth.status === "unauthenticated" ? 401 : 503) };
 if (!hasAdultAccess(auth.actor)) return { ok: false as const, response: storyJson({ error: "Adult member access required" }, 403) };
 const db = getServerSupabase();
 if (!db) return { ok: false as const, response: storyJson({ error: "Stories unavailable" }, 503) };
 return { ok: true as const, db, actor: auth.actor };
}
