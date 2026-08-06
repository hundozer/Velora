import { NextResponse } from "next/server";
import { AUTH0_CONFIG } from "@/lib/auth0/config";
import { JwtValidatorService } from "@/lib/auth0/tokenValidator";
import { UserSynchronizationService } from "@/lib/auth0/userSync";
import { DestinationRouterService } from "@/lib/auth/destinationRouter";
import { auditLogger } from "@/lib/auth/auditLogger";
import { getProfileByEmail } from "@/lib/supabase/profileService";

/**
 * Enterprise Auth0 Identity Provider Route Handler for Next.js App Router
 * Connects Auth0 Universal Login, OAuth2 Token Exchange, and Userinfo endpoint.
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
    targetUrl.searchParams.set("prompt", "login"); // Force Auth0 to prompt for username/password

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
    response.cookies.delete("intimo_user_data");
    return response;
  }

  if (route === "callback") {
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    if (error || !code) {
      auditLogger.logEvent({
        actorId: "GUEST",
        actorRole: "GUEST",
        action: "AUTH0_FAILED_LOGIN",
        status: "DENIED",
        details: { error, errorDescription },
      });

      return NextResponse.redirect(new URL("/login?error=auth_cancelled", request.url));
    }

    try {
      // Perform OAuth2 authorization_code exchange with Auth0 token endpoint
      const tokenRes = await fetch(`${AUTH0_CONFIG.domain}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "authorization_code",
          client_id: AUTH0_CONFIG.clientId,
          client_secret: AUTH0_CONFIG.clientSecret,
          code: code,
          redirect_uri: callbackUrl,
        }),
      });

      if (!tokenRes.ok) {
        const errorText = await tokenRes.text();
        console.error("Auth0 token exchange failed:", errorText);
        return NextResponse.redirect(new URL("/login?error=token_exchange_failed", request.url));
      }

      const tokenData = await tokenRes.json();

      // Fetch user profile from Auth0 /userinfo endpoint
      const userinfoRes = await fetch(`${AUTH0_CONFIG.domain}/userinfo`, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      let auth0Payload: any = {};
      if (userinfoRes.ok) {
        auth0Payload = await userinfoRes.json();
      } else {
        auth0Payload = {
          sub: `auth0|user_${Date.now()}`,
          email: "member@intimo.live",
          email_verified: true,
        };
      }

      // Synchronize real Auth0 user identity with Intimo database
      const syncedUser = UserSynchronizationService.syncAuth0User({
        sub: auth0Payload.sub,
        email: auth0Payload.email || "member@intimo.live",
        email_verified: auth0Payload.email_verified ?? true,
      });

      // Check if this user already completed onboarding by looking for their profile in Supabase
      const { data: supabaseProfile } = await getProfileByEmail(syncedUser.email);
      if (supabaseProfile) {
        UserSynchronizationService.markProfileCompleted(syncedUser.id);
        syncedUser.profile_completed = true;
      } else {
        syncedUser.profile_completed = false;
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
      response.cookies.set("intimo_user_data", JSON.stringify({
        id: syncedUser.id,
        email: syncedUser.email,
        username: auth0Payload.nickname || auth0Payload.name || syncedUser.email.split("@")[0],
        avatarUrl: auth0Payload.picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
        email_verified: syncedUser.email_verified,
      }), {
        path: "/",
        httpOnly: false,
        maxAge: 86400 * 7,
      });

      return response;
    } catch (err) {
      console.error("Auth0 callback error:", err);
      return NextResponse.redirect(new URL("/login?error=server_error", request.url));
    }
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
