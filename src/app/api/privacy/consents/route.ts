import { NextRequest, NextResponse } from "next/server";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { auditLogger } from "@/lib/auth/auditLogger";
import { appendDurableAudit } from "@/lib/auth/durableAudit";
import { CONSENTS, MEMBER_CONSENT_TYPES, consentRow, consentStates, type ConsentType } from "@/lib/privacy/consents.mjs";

export const dynamic = "force-dynamic";
const COLUMNS = "consent_type,consent_version,consent_timestamp,consent_status,withdrawn_at,source";

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

/** The member's consent state per category, plus their full history (newest first). */
export async function GET(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return noStore(NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 }));
  const supabase = getServerSupabase();
  if (!supabase) return noStore(NextResponse.json({ error: "Privacy service unavailable" }, { status: 503 }));
  const { data, error } = await supabase.from("user_consents").select(COLUMNS).eq("profile_id", actor.actor.profileId).order("consent_timestamp", { ascending: false });
  if (error) return noStore(NextResponse.json({ error: "Consent lookup failed" }, { status: 502 }));
  const consents = (data || []).filter((row) => (MEMBER_CONSENT_TYPES as string[]).includes(row.consent_type));
  const states = consentStates(consents);
  // A withdrawal whose deletion failed leaves data behind. Report it so Settings can offer
  // "Delete now" until it is gone, including after a page reload.
  const pendingErasure: Partial<Record<ConsentType, boolean>> = {};
  for (const type of MEMBER_CONSENT_TYPES) {
    if (states[type].granted) continue;
    const spec = CONSENTS[type];
    let pending = false;
    if (spec.erasesProfileColumns.length) {
      const { data: profile, error: profileError } = await supabase.from("profiles").select(spec.erasesProfileColumns.join(",")).eq("id", actor.actor.profileId).maybeSingle();
      if (profileError) return noStore(NextResponse.json({ error: "Consent lookup failed" }, { status: 502 }));
      pending = spec.erasesProfileColumns.some((column) => (profile as Record<string, unknown> | null)?.[column] != null);
    }
    for (const table of spec.erasesTables || []) {
      if (pending) break;
      const { data: rows, error: tableError } = await supabase.from(table).select("profile_id").eq("profile_id", actor.actor.profileId).limit(1);
      if (tableError) return noStore(NextResponse.json({ error: "Consent lookup failed" }, { status: 502 }));
      pending = Boolean(rows?.length);
    }
    pendingErasure[type] = pending;
  }
  return noStore(NextResponse.json({ consents, states, pendingErasure }));
}

/**
 * Grants or withdraws one consent. Withdrawal deletes the data that consent covered, in the
 * same request, before the change is reported as done. Consent rows are append-only evidence.
 */
export async function POST(req: NextRequest) {
  const actor = await resolveServerActor(req);
  if (actor.status !== "authenticated") return noStore(NextResponse.json({ error: "Authentication required" }, { status: actor.status === "unauthenticated" ? 401 : 503 }));
  const rate = (await checkRateLimit(`consent:${actor.actor.userId}`, 20, 60 * 60));
  if (!rate.allowed) return NextResponse.json({ error: "Too many consent changes" }, { status: 429 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const input = body as Record<string, unknown>;
  const consentType = typeof input.consentType === "string" ? input.consentType : "";
  const granted = input.granted;
  if (!(MEMBER_CONSENT_TYPES as string[]).includes(consentType) || typeof granted !== "boolean") return NextResponse.json({ error: "Invalid consent choice" }, { status: 400 });
  const type = consentType as ConsentType;
  const spec = CONSENTS[type];
  const supabase = getServerSupabase();
  if (!supabase) return NextResponse.json({ error: "Privacy service unavailable" }, { status: 503 });
  const profileId = actor.actor.profileId;
  const row = consentRow({ profileId, type, granted, source: "PRIVACY_CENTER" });

  const { error } = await supabase.from("user_consents").insert(row);
  if (error) return NextResponse.json({ error: "Consent update failed" }, { status: 502 });

  // Withdrawal erases what the consent covered. Done after the withdrawal row exists, so a
  // failure leaves the member recorded as withdrawn and the erasure retryable, never the reverse.
  if (!granted) {
    if (spec.erasesProfileColumns.length) {
      const cleared = Object.fromEntries(spec.erasesProfileColumns.map((column) => [column, null]));
      const { error: eraseError } = await supabase.from("profiles").update({ ...cleared, updated_at: row.consent_timestamp }).eq("id", profileId);
      if (eraseError) return NextResponse.json({ error: "Consent withdrawn but your details could not be deleted; please try again" }, { status: 502 });
    }
    for (const table of spec.erasesTables || []) {
      const { error: eraseError } = await supabase.from(table).delete().eq("profile_id", profileId);
      if (eraseError) return NextResponse.json({ error: "Consent withdrawn but your details could not be deleted; please try again" }, { status: 502 });
    }
  }

  const action = granted ? "CONSENT_GRANTED" : "CONSENT_WITHDRAWN";
  auditLogger.logEvent({ actorId: actor.actor.userId, actorRole: actor.actor.role as any, action, resourceType: "CONSENT", status: "SUCCESS", details: { consentType: type, consentVersion: spec.version } });
  const audited = await appendDurableAudit(supabase, { actorProfileId: profileId, actorUserId: actor.actor.userId, action, resourceType: "CONSENT", resourceId: type, outcome: "SUCCESS", metadata: { consentVersion: spec.version } });
  if (!audited) return NextResponse.json({ error: "Consent saved but audit evidence failed; contact support" }, { status: 502 });
  return noStore(NextResponse.json({ consentType: type, consentVersion: spec.version, status: row.consent_status, timestamp: row.consent_timestamp }));
}
