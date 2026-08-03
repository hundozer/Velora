import { NextResponse } from "next/server";
import { AUTH0_CONFIG } from "@/lib/auth/auth0Config";
import { JwtValidatorService } from "@/lib/auth/jwtValidator";
import { UserSynchronizationService } from "@/lib/auth/userSync";

/**
 * Enterprise Auth0 Integration API Route Handler for Velora Next.js App Router
 * Handles /api/auth/login, /api/auth/logout, /api/auth/callback, and /api/auth/me
 */
export async function GET(request: Request, { params }: { params: { auth0: string } }) {
  const route = params.auth0;
  const url = new URL(request.url);

  if (route === "login") {
    // Redirect to Auth0 Hosted Universal Login
    const targetUrl = new URL(`${AUTH0_CONFIG.domain}/authorize`);
    targetUrl.searchParams.set("response_type", "code");
    targetUrl.searchParams.set("client_id", AUTH0_CONFIG.clientId);
    targetUrl.searchParams.set("redirect_uri", AUTH0_CONFIG.callbackUrl);
    targetUrl.searchParams.set("scope", "openid profile email");
    targetUrl.searchParams.set("audience", AUTH0_CONFIG.audience);

    return NextResponse.redirect(targetUrl.toString());
  }

  if (route === "logout") {
    // Redirect to Auth0 Logout endpoint
    const logoutUrl = new URL(`${AUTH0_CONFIG.domain}/v2/logout`);
    logoutUrl.searchParams.set("client_id", AUTH0_CONFIG.clientId);
    logoutUrl.searchParams.set("returnTo", AUTH0_CONFIG.logoutUrl);

    return NextResponse.redirect(logoutUrl.toString());
  }

  if (route === "callback") {
    const code = url.searchParams.get("code");
    if (!code) {
      return NextResponse.redirect(new URL("/login?error=auth0_code_missing", request.url));
    }

    // In production, exchange authorization code for tokens via Auth0 token endpoint
    // Synchronize authenticated identity with local Velora database
    const mockAuth0Payload = {
      sub: `auth0|user_${Date.now()}`,
      email: "auth0.user@velora.club",
      email_verified: true,
      iss: AUTH0_CONFIG.domain,
      aud: AUTH0_CONFIG.audience,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    UserSynchronizationService.syncAuth0User(mockAuth0Payload);

    return NextResponse.redirect(new URL("/discovery", request.url));
  }

  if (route === "me") {
    const authHeader = request.headers.get("authorization");
    const jwtCheck = JwtValidatorService.validateAuth0Token(authHeader || undefined);

    if (!jwtCheck.isValid || !jwtCheck.payload) {
      return NextResponse.json({ error: jwtCheck.message }, { status: jwtCheck.statusCode });
    }

    const localUser = UserSynchronizationService.getUserByAuth0Id(jwtCheck.payload.sub);
    return NextResponse.json({
      auth0: jwtCheck.payload,
      veloraUser: localUser,
    });
  }

  return NextResponse.json({ error: "Unknown Auth0 route" }, { status: 404 });
}

export async function POST(request: Request, context: { params: { auth0: string } }) {
  return GET(request, context);
}
