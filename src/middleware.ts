import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Resilient Next.js Middleware for Auth0 Session Management & Route Protection
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets and internal Next.js routes bypass middleware
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  try {
    const auth0Secret = process.env.AUTH0_SECRET;
    if (!auth0Secret) {
      return NextResponse.next();
    }

    // Dynamic import to handle edge runtime safety
    const { auth0 } = await import("@/lib/auth0/client");
    return await auth0.middleware(request);
  } catch (err: any) {
    // Fail open safely if Auth0 credentials are not set during local dev/staging
    console.warn(`[MIDDLEWARE SHIELD WARNING] ${err.message}`);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
