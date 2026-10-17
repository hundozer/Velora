import { NextRequest, NextResponse } from "next/server";
import { createSessionClient } from "@/lib/supabase/session";
import { safeReturnTo } from "@/lib/auth/accountState.mjs";

async function logout(req: NextRequest) {
  const url = new URL(req.url);
  const supabase = createSessionClient();
  if (supabase) await supabase.auth.signOut();
  return NextResponse.redirect(new URL(safeReturnTo(url.searchParams.get("returnTo")) || "/", url.origin), 303);
}

export const GET = logout;
export const POST = logout;
