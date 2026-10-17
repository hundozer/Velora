"use client";

import { useEffect, useRef } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export type MessageRealtimeEvent = { kind: "INSERT" | "UPDATE"; conversationId: string };

/**
 * Supabase Realtime on direct_messages for the signed-in member (P1-09).
 * RLS (member_read_own_direct_messages) limits delivery to rows the member is a
 * participant in; the filters only narrow it further. Events are signals to
 * re-read through the API, so server-side checks (blocks, read state) stay the
 * single source of truth.
 */
export function useMessageRealtime(profileId: string | undefined, onEvent: (event: MessageRealtimeEvent) => void) {
  const handler = useRef(onEvent);
  handler.current = onEvent;

  useEffect(() => {
    if (!profileId) return;
    let supabase: ReturnType<typeof createBrowserSupabase>;
    try { supabase = createBrowserSupabase(); } catch { return; }
    const emit = (kind: MessageRealtimeEvent["kind"]) => (payload: { new: Record<string, unknown> }) => {
      const conversationId = payload.new?.conversation_id;
      if (typeof conversationId === "string") handler.current({ kind, conversationId });
    };
    const channel = supabase
      .channel(`direct-messages:${profileId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages", filter: `receiver_id=eq.${profileId}` }, emit("INSERT"))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages", filter: `sender_id=eq.${profileId}` }, emit("INSERT"))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "direct_messages", filter: `sender_id=eq.${profileId}` }, emit("UPDATE"))
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [profileId]);
}
