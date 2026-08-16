import { getServerSupabase } from "@/lib/supabase/server";

export async function areFriends(first: string, second: string) {
  const db = getServerSupabase();
  if (!db || first === second) return false;
  const { data, error } = await db.from("friendships").select("id").eq("status", "ACCEPTED")
    .or(`and(requester_id.eq.${first},addressee_id.eq.${second}),and(requester_id.eq.${second},addressee_id.eq.${first})`).limit(1).maybeSingle();
  return !error && Boolean(data);
}
