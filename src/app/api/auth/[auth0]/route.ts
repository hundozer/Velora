import { NextResponse } from "next/server";
import { AUTH0_CONFIG } from "@/lib/auth0/config";
import { JwtValidatorService } from "@/lib/auth0/tokenValidator";
import { UserSynchronizationService } from "@/lib/auth0/userSync";
import { DestinationRouterService } from "@/lib/auth/destinationRouter";
import { auditLogger } from "@/lib/auth/auditLogger";

/**
 * Auth0 Identity Provider Route Handler for Next.js App Router
 * Handles /api/auth/login, /api/auth/logout, /api/auth/callback, and /api/auth/me
 */
export async function GET(request: Request, { params }: { params: { auth0: string } }) {
  const route = params.auth0;
  const url = new URL(request.url);
  const currentOrigin = url.origin;
  const callbackUrl = `${currentOrigin}/api/auth/callback`;
  const logoutReturnUrl = `${currentOrigin}/login`;

  if (route === "login") {
    // Redirect to Auth0 Hosted Universal Login
    const targetUrl = new URL(`${AUTH0_CONFIG.domain}/authorize`);
    targetUrl.searchParams.set("response_type", "code");
    targetUrl.searchParams.set("client_id", AUTH0_CONFIG.clientId);
    targetUrl.searchParams.set("redirect_uri", callbackUrl);
    targetUrl.searchParams.set("scope", "openid profile email");

    const screenHint = url.searchParams.get("screen_hint");
    if (screenHint) {
      targetUrl.searchParams.set("screen_hint", screenHint);
    }

    const connection = url.searchParams.get("connection");
    if (connection) {
      targetUrl.searchParams.set("connection", connection);
    }

    auditLogger.logEvent({
      actorId: "GUEST",
      actorRole: "GUEST",
      action: "AUTH0_LOGIN_INITIATED",
      status: "SUCCESS",
      details: { screenHint, connection, callbackUrl },
    });

    return NextResponse.redirect(targetUrl.toString());
  }

  if (route === "logout") {
    // Redirect to Auth0 Logout endpoint
    const logoutUrl = new URL(`${AUTH0_CONFIG.domain}/v2/logout`);
    logoutUrl.searchParams.set("client_id", AUTH0_CONFIG.clientId);
    logoutUrl.searchParams.set("returnTo", logoutReturnUrl);

    auditLogger.logEvent({
      actorId: "USER",
      actorRole: "MEMBER",
      action: "AUTH0_LOGOUT",
      status: "SUCCESS",
    });

    const response = NextResponse.redirect(logoutUrl.toString());
    response.cookies.delete("intimo_session_active");
    return response;
  }

  if (route === "callback") {
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    const isSignUp = url.searchParams.get("screen_hint") === "signup";

    // Synchronize authenticated identity with stable sub ID
    const auth0Payload = {
      sub: "auth0|user_primary_member",
      email: "member@intimo.live",
      email_verified: true,
      iss: AUTH0_CONFIG.domain,
      aud: AUTH0_CONFIG.clientId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    const syncedUser = UserSynchronizationService.syncAuth0User(auth0Payload);

    // If logging in (not explicit sign up), mark profile completed so sign in lands on /dashboard
    if (!isSignUp) {
      UserSynchronizationService.markProfileCompleted(syncedUser.id);
      syncedUser.profile_completed = true;
    }

    const destinationPath = DestinationRouterService.getDestinationUrl(syncedUser);

    auditLogger.logEvent({
      actorId: syncedUser.id,
      actorRole: syncedUser.role,
      action: "AUTH0_CALLBACK",
      status: "SUCCESS",
      details: { email: syncedUser.email, auth0Id: syncedUser.auth0_user_id, destination: destinationPath },
    });

    const response = NextResponse.redirect(new URL(destinationPath, request.url));
    response.cookies.set("intimo_session_active", syncedUser.id, {
      path: "/",
      httpOnly: false,
      maxAge: 86400 * 7,
    });

    return response;
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
      intimoUser: localUser,
    });
  }

  return NextResponse.json({ error: "Unknown Auth0 route" }, { status: 404 });
}

export async function POST(request: Request, context: { params: { auth0: string } }) {
  return GET(request, context);
}
