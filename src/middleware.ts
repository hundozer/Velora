import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { MONETIZATION_ENABLED, isMonetizationRoute, isMvpSafetyDisabledRoute } from "@/lib/features";
import { COMING_SOON, isOpenWhileComingSoon } from "@/lib/comingSoon.mjs";

/** Coming Soon: signed-out visitors go back to the front page; public APIs answer 404. */
function comingSoonResponse(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ error: "Not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  return NextResponse.redirect(new URL("/", request.url), 307);
}

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

  const hasSessionHint = request.cookies.getAll().some(({ name, value }) => value && /^sb-.+-auth-token(?:\.\d+)?$/.test(name));
  const gated = COMING_SOON && !isOpenWhileComingSoon(pathname);
  // There is nothing to refresh for a cookie-free visitor. Protected handlers
  // still verify identity themselves; this shortcut never grants access.
  if (!hasSessionHint) return gated ? comingSoonResponse(request) : NextResponse.next({ request });

  const nextResponse = () => {
    if (pathname === "/") {
      const target = request.nextUrl.clone();
      target.pathname = "/member-home";
      const rewritten = NextResponse.rewrite(target, { request });
      rewritten.headers.set("Cache-Control", "private, no-store");
      return rewritten;
    }
    return NextResponse.next({ request });
  };
  let response = nextResponse();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = nextResponse();
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  // Refreshes an expiring session and writes the rotated cookies onto the response.
  const { data: { user } } = await supabase.auth.getUser();
  // A stale or forged session cookie does not open the closed site.
  if (gated && !user) {
    const closed = comingSoonResponse(request);
    response.cookies.getAll().forEach((cookie) => closed.cookies.set(cookie));
    return closed;
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
