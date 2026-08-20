import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { MONETIZATION_ENABLED, isMonetizationRoute, isMvpSafetyDisabledRoute } from "@/lib/features";
import { validateProductionAuthConfiguration } from "@/lib/auth0/configValidation.mjs";

/**
 * Resilient Next.js Middleware for Auth0 Session Management & Route Protection
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

  // Static assets bypass middleware. Auth routes must pass through the SDK.
  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  try {
    const required = ["AUTH0_SECRET", "AUTH0_CLIENT_ID", "AUTH0_CLIENT_SECRET", "AUTH0_ISSUER_BASE_URL"];
    const missing = required.filter((name) => !process.env[name]);
    if (missing.length > 0 && process.env.NODE_ENV !== "production") {
      console.warn(`[AUTH CONFIG] Authentication disabled locally; missing: ${missing.join(", ")}`);
      return NextResponse.next();
    }

    const productionAuth = validateProductionAuthConfiguration(process.env);
    if (process.env.NODE_ENV === "production" && !productionAuth.valid) {
      console.error("[AUTH CONFIG] Production authentication configuration is invalid", {
        missing: productionAuth.missing,
        issuerValid: productionAuth.issuerValid,
      });
      return NextResponse.json({ error: "Authentication service is unavailable" }, { status: 503 });
    }

    // Dynamic import to handle edge runtime safety
    const { auth0 } = await import("@/lib/auth0/client");
    return await auth0.middleware(request);
  } catch (err) {
    console.error("[AUTH MIDDLEWARE] Authentication processing failed", err);
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Authentication service is unavailable" }, { status: 503 });
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
