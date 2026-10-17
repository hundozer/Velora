import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { toAnonymousPublicProfile } from "@/lib/supabase/publicCommunity";
import type { PublicProfileRow } from "@/lib/supabase/publicCommunity";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id?.trim();
  if (!id || !UUID.test(id)) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  const client = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rate = checkRateLimit(`public-profile:${client.slice(0, 80)}`, 90, 60);
  if (!rate.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(rate.resetInSeconds) } });

  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Public profile is temporarily unavailable" }, { status: 503 });
  const { data, error } = await db
    .from("profiles")
    .select("id,display_name,username,age,country,city,headline,bio,is_couple_profile,verification_status,verification_level,location_precision,show_online_status,last_active_at,created_at")
    .eq("id", id)
    .eq("profile_visibility", "EVERYONE")
    .eq("public_profile_visibility", true)
    .eq("account_status", "ACTIVE")
    .eq("discovery_disabled", false)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Public profile lookup failed" }, { status: 502 });
  if (!data) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  return NextResponse.json(
    { profile: toAnonymousPublicProfile(data as PublicProfileRow) },
    { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120", "X-Robots-Tag": "index, follow" } }
  );
}
