import { NextRequest, NextResponse } from "next/server";
import { AGE_DECLARATION_COOKIE, AGE_DECLARATION_MAX_AGE, createAgeDeclarationValue } from "@/lib/auth/ageDeclaration";
import { checkRateLimit } from "@/lib/security/rateLimiter";

export async function POST(req: NextRequest) {
  const client = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(`age-declaration:${client.slice(0, 80)}`, 10, 60 * 60).allowed) {
    return NextResponse.json({ error: "Too many declarations" }, { status: 429 });
  }
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid declaration" }, { status: 400 }); }
  if (!body || typeof body !== "object" || (body as { adult?: unknown }).adult !== true) {
    return NextResponse.json({ error: "Adult declaration is required" }, { status: 400 });
  }
  const value = createAgeDeclarationValue();
  if (!value) return NextResponse.json({ error: "Age declaration service unavailable" }, { status: 503 });
  const response = NextResponse.json({ declared: true, assurance: "SELF_DECLARATION_ONLY" });
  response.cookies.set(AGE_DECLARATION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AGE_DECLARATION_MAX_AGE,
  });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
