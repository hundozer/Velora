import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { notifyInvitationRequest, parseInvitationRequest } from "@/lib/invitations/requests";

// Public "request an invitation" form on the landing page. An admin approves or
// rejects each request; approval sends a normal single-use member invitation.
export const dynamic = "force-dynamic";
const noStore = { "Cache-Control": "private, no-store" };
// Same answer whatever happened, so the form never reveals who is already a member.
const received = () => NextResponse.json({ received: true }, { headers: noStore });

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const perIp = (await checkRateLimit(`invitation-request-ip:${ip}`, 5, 60 * 60));
  if (!perIp.allowed) return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429, headers: noStore });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400, headers: noStore }); }
  // Hidden field people never see; bots fill it in.
  if (body && typeof body === "object" && typeof (body as Record<string, unknown>).website === "string" && (body as Record<string, string>).website) return received();
  const request = parseInvitationRequest(body);
  if (!request) return NextResponse.json({ error: "Please answer every question and confirm you are 18 or older." }, { status: 400, headers: noStore });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Requests are temporarily unavailable" }, { status: 503, headers: noStore });

  const { data: existing, error: existingError } = await db.from("profiles").select("id").eq("email", request.email).limit(1);
  if (existingError) return NextResponse.json({ error: "Requests are temporarily unavailable" }, { status: 503, headers: noStore });
  if (existing?.length) return received();

  const { data, error } = await db.from("invitation_requests").insert({
    email: request.email, email_sha256: createHash("sha256").update(request.email).digest("hex"),
    identity: request.identity, based_in: request.basedIn, intent: request.intent, language: request.language,
  }).select("id").maybeSingle();
  // 23505: this address already has an open request. Don't alert the team twice.
  if (error?.code === "23505") return received();
  if (error || !data) return NextResponse.json({ error: "Requests are temporarily unavailable" }, { status: 503, headers: noStore });
  await notifyInvitationRequest({ ...request, id: data.id });
  return received();
}
