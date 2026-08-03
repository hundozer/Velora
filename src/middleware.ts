import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

export async function middleware(request: any) {
  try {
    // Only invoke Auth0 middleware if AUTH0_SECRET is set
    if (process.env.AUTH0_SECRET && process.env.AUTH0_SECRET !== "YOUR_AUTH0_SECRET") {
      const authResponse = await auth0.middleware(request);
      if (authResponse) {
        return authResponse;
      }
    }
  } catch (error: any) {
    console.warn("[MIDDLEWARE WARNING] Auth0 middleware invocation bypassed:", error?.message || error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
