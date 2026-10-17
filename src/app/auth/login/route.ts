import { NextRequest, NextResponse } from "next/server";
import { safeReturnTo } from "@/lib/auth/accountState.mjs";

// Compatibility entry point for existing links: /auth/login[?screen_hint=signup][&returnTo=/x]
export function GET(req: NextRequest) {
  const url = new URL(req.url);
  const target = new URL(url.searchParams.get("screen_hint") === "signup" ? "/register" : "/login", url.origin);
  const returnTo = safeReturnTo(url.searchParams.get("returnTo"));
  if (returnTo) target.searchParams.set("returnTo", returnTo);
  return NextResponse.redirect(target, 303);
}
