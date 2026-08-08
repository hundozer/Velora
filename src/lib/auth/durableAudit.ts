import type { SupabaseClient } from "@supabase/supabase-js";

type Outcome = "SUCCESS" | "DENIED" | "ERROR";

export async function appendDurableAudit(db: SupabaseClient, event: {
  actorProfileId?: string | null; actorAuth0Sub?: string | null; action: string;
  resourceType?: string; resourceId?: string; outcome: Outcome; metadata?: Record<string, unknown>;
}): Promise<boolean> {
  const { error } = await db.from("audit_events").insert({
    actor_profile_id: event.actorProfileId || null,
    actor_auth0_sub: event.actorAuth0Sub || null,
    action: event.action.slice(0, 160), resource_type: event.resourceType?.slice(0, 80) || null,
    resource_id: event.resourceId?.slice(0, 200) || null, outcome: event.outcome,
    metadata: event.metadata || {},
  });
  if (error) console.error("Durable audit append failed", { code: error.code, action: event.action });
  return !error;
}
