import { NextRequest, NextResponse } from "next/server";
import { getVerifiedIdentity } from "@/lib/auth/serverSession";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { decryptDraft, draftExpiry, draftsEnabled, encryptDraft } from "@/lib/onboarding/draftCrypto";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers });

type Fields = {
  step: string;
  profileType: string;
  gender: string;
  relationshipStatus: string;
  displayName: string;
  dateOfBirth: string;
  partnerDisplayName: string;
  partnerDateOfBirth: string;
  lookingFor: string[];
  areaId: string;
};
const allowed = new Set(["kind", "identity", "relationship", "name", "birthday", "partner", "looking", "area"]);
const safeString = (v: unknown, max: number) => typeof v === "string" && v.length <= max ? v : null;
function normalize(value: unknown): Fields | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const fields = ["step", "profileType", "gender", "relationshipStatus", "displayName", "dateOfBirth", "partnerDisplayName", "partnerDateOfBirth", "areaId"];
  if (Object.keys(v).some(k => ![...fields, "lookingFor"].includes(k))) return null;
  const strings = fields.map(f => safeString(v[f], f.includes("Name") ? 80 : 64));
  if (strings.some(s => s === null)) return null;
  if (!allowed.has(strings[0] as string)) return null;
  if (!["", "SINGLE", "COUPLE"].includes(strings[1] as string)) return null;
  if (!Array.isArray(v.lookingFor) || v.lookingFor.length > 15 || v.lookingFor.some(s => typeof s !== "string" || s.length > 64)) return null;
  if ((strings[5] && !/^\d{4}-\d{2}-\d{2}$/.test(strings[5] as string)) || (strings[7] && !/^\d{4}-\d{2}-\d{2}$/.test(strings[7] as string))) return null;
  return {
    step: strings[0]!, profileType: strings[1]!, gender: strings[2]!,
    relationshipStatus: strings[3]!, displayName: strings[4]!,
    dateOfBirth: strings[5]!, partnerDisplayName: strings[6]!,
    partnerDateOfBirth: strings[7]!, lookingFor: v.lookingFor as string[],
    areaId: strings[8]!,
  };
}

async function access(allowCompleted = false) {
  const identity = await getVerifiedIdentity();
  if (!identity?.emailVerified) return { error: json({ error: "Verified sign-in required" }, 401) };
  if (!draftsEnabled()) return { error: json({ error: "Draft saving unavailable" }, 503) };
  const db = getServerSupabase();
  if (!db) return { error: json({ error: "Draft saving unavailable" }, 503) };
  // No draft endpoint access after onboarding completes; authenticated users
  // cannot read or overwrite drafts belonging to another account.
  const { data: profile, error } = await db.from("profiles").select("id").eq("auth_id", identity.sub).maybeSingle();
  if (error) return { error: json({ error: "Draft lookup unavailable" }, 502) };
  if (profile && !allowCompleted) return { error: json({ error: "Onboarding already completed" }, 409) };
  return { db, subject: identity.sub };
}

export async function GET() {
  const ctx = await access();
  if ("error" in ctx) return ctx.error;
  const { data, error } = await ctx.db.from("onboarding_drafts")
    .select("ciphertext,nonce,expires_at").eq("user_id", ctx.subject).maybeSingle();
  if (error) return json({ error: "Draft lookup unavailable" }, 502);
  if (!data || Date.parse(data.expires_at) <= Date.now()) return json({ draft: null });
  try {
    const draft = normalize(decryptDraft(data.ciphertext, data.nonce, ctx.subject));
    return json({ draft }); // Never return ciphertext, nonce or secret to browser
  } catch {
    return json({ error: "Saved draft could not be opened. You can start again." }, 409);
  }
}

export async function PUT(req: NextRequest) {
  const ctx = await access();
  if ("error" in ctx) return ctx.error;
  if (!(await checkRateLimit(`onboarding-draft:${ctx.subject}`, 30, 3600)).allowed)
    return json({ error: "Too many saves. Try again later." }, 429);
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return json({ error: "Invalid origin" }, 403);
  const length = Number(req.headers.get("content-length") || 0);
  if (!Number.isFinite(length) || length > 4096) return json({ error: "Draft is too large" }, 413);
  let body: unknown;
  try { body = await req.json(); } catch { return json({ error: "Invalid draft" }, 400) }
  if (Buffer.byteLength(JSON.stringify(body), "utf8") > 4096) return json({ error: "Draft is too large" }, 413);
  if (!body || typeof body !== "object" || Array.isArray(body) ||
      (body as Record<string, unknown>).saveConsent !== true)
    return json({ error: "Explicit consent required to save draft" }, 400);
  const draft = normalize((body as Record<string, unknown>).draft);
  if (!draft) return json({ error: "Invalid draft" }, 400);
  const encrypted = encryptDraft(draft, ctx.subject);
  const { error } = await ctx.db.from("onboarding_drafts").upsert({
    user_id: ctx.subject, ...encrypted, expires_at: draftExpiry(), updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) return json({ error: "Draft could not be saved" }, 502);
  return json({ saved: true, expiresAt: draftExpiry() });
}

export async function DELETE() {
  // Delete the draft after successful profile creation as well.
  const ctx = await access(true);
  if ("error" in ctx) return ctx.error;
  const { error } = await ctx.db.from("onboarding_drafts").delete().eq("user_id", ctx.subject);
  if (error) return json({ error: "Draft could not be deleted" }, 502);
  return json({ deleted: true });
}
