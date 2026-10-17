import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSessionClient } from "@/lib/supabase/session";
import { safeReturnTo } from "@/lib/auth/accountState.mjs";

const TYPES = new Set<EmailOtpType>(["signup", "email", "magiclink", "recovery", "email_change", "invite"]);

// Token-hash verification from the Supabase email templates; works across devices.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const supabase = createSessionClient();
  if (!tokenHash || !type || !TYPES.has(type) || !supabase) {
    return NextResponse.redirect(new URL("/login?error=link_invalid", url.origin), 303);
  }
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) return NextResponse.redirect(new URL("/login?error=link_expired", url.origin), 303);
  const fallback = type === "recovery" ? "/update-password" : "/dashboard";
  return NextResponse.redirect(new URL(safeReturnTo(url.searchParams.get("next")) || fallback, url.origin), 303);
}
