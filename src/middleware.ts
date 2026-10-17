import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { MONETIZATION_ENABLED, isMonetizationRoute, isMvpSafetyDisabledRoute } from "@/lib/features";

/**
 * Route gating plus Supabase session refresh. Authorization itself happens in
 * server layouts and route handlers; this only keeps the auth cookie fresh.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // MONETIZATION_DISABLED: keep future architecture inaccessible in the free MVP.
  if (!MONETIZATION_ENABLED && isMonetizationRoute(pathname)) {
    return NextResponse.redirect(new URL("/discovery", request.url), 307);
  }
  if (isMvpSafetyDisabledRoute(pathname)) {
    return NextResponse.redirect(new URL("/discovery", request.url), 307);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Authentication service is unavailable" }, { status: 503 });
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  // Refreshes an expiring session and writes the rotated cookies onto the response.
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
