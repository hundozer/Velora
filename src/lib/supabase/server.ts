import { createClient, SupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";

let serverClient: SupabaseClient | null = null;

export function getServerSupabase(): SupabaseClient | null {
  if (serverClient) return serverClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceRoleKey) return null;

  serverClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    // Supabase's browser-shaped constructor type is narrower than the ws
    // implementation, although ws satisfies the runtime contract in Node.
    realtime: { transport: WebSocket as unknown as typeof globalThis.WebSocket },
  });
  return serverClient;
}
