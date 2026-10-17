import { NextRequest, NextResponse } from "next/server";
import { createSessionClient } from "@/lib/supabase/session";
import { safeReturnTo } from "@/lib/auth/accountState.mjs";

// PKCE code exchange for email links opened in the same browser (and future OAuth providers).
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = safeReturnTo(url.searchParams.get("next")) || "/dashboard";
  const supabase = createSessionClient();
  if (!code || !supabase) return NextResponse.redirect(new URL("/login?error=link_invalid", url.origin), 303);
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/login?error=link_invalid", url.origin), 303);
  return NextResponse.redirect(new URL(next, url.origin), 303);
}
