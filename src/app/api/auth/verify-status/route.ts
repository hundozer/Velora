import { NextRequest, NextResponse } from "next/server";
import { AUTH0_CONFIG } from "@/lib/auth0/config";
import { UserSynchronizationService } from "@/lib/auth0/userSync";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Read the user data cookie
    const cookieUserDataVal = req.cookies.get("intimo_user_data")?.value;
    if (!cookieUserDataVal) {
      return NextResponse.json({ verified: false, error: "No active session cookie found" }, {
        headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" }
      });
    }

    const cookieUserData = JSON.parse(decodeURIComponent(cookieUserDataVal));
    const userId = cookieUserData.id;
    const auth0UserId = cookieUserData.auth0_user_id;
    const email = cookieUserData.email;

    if (!userId || !email) {
      return NextResponse.json({ verified: false, error: "Invalid session cookie format" }, {
        headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" }
      });
    }

    // 1. Obtain Auth0 Management API Access Token
    const issuer = AUTH0_CONFIG.issuer.endsWith("/") ? AUTH0_CONFIG.issuer.slice(0, -1) : AUTH0_CONFIG.issuer;
    const tokenRes = await fetch(`${issuer}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: AUTH0_CONFIG.clientId,
        client_secret: AUTH0_CONFIG.clientSecret,
        audience: `${issuer}/api/v2/`,
      }),
    });

    if (!tokenRes.ok) {
      console.error("Failed to fetch Auth0 Management token for polling:", await tokenRes.text());
      return NextResponse.json({ verified: false, error: "Identity provider authentication failed" }, {
        headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" }
      });
    }

    const tokenData = await tokenRes.json();
    const mToken = tokenData.access_token;

    // 2. Resolve target Auth0 User ID (prefer exact session ID, fall back to email search)
    let targetAuth0Id = auth0UserId;
    if (!targetAuth0Id || !targetAuth0Id.startsWith("auth0|")) {
      console.log(`Auth0 ID not found in cookie for ${email}. Searching by email...`);
      const searchRes = await fetch(`${issuer}/api/v2/users-by-email?email=${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${mToken}` },
      });

      if (searchRes.ok) {
        const users = await searchRes.json();
        if (users && users.length > 0) {
          targetAuth0Id = users[0].user_id;
        }
      }
    }

    if (!targetAuth0Id || !targetAuth0Id.startsWith("auth0|")) {
      return NextResponse.json({ verified: false, error: "Could not locate Auth0 account" }, {
        headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" }
      });
    }

    // 3. Query Auth0 for this exact user profile
    console.log(`Polling verification status in Auth0 for ID: ${targetAuth0Id}`);
    const userRes = await fetch(`${issuer}/api/v2/users/${encodeURIComponent(targetAuth0Id)}`, {
      headers: {
        Authorization: `Bearer ${mToken}`,
      },
    });

    if (!userRes.ok) {
      console.error("Auth0 user query failed:", await userRes.text());
      return NextResponse.json({ verified: false, error: "Auth0 user query failed" }, {
        headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" }
      });
    }

    const auth0User = await userRes.json();
    const isEmailVerified = auth0User.email_verified ?? false;

    if (isEmailVerified) {
      console.log(`User email verified detected for: ${email}`);

      // 4. Synchronize user in local store to set email_verified: true
      const syncedUser = UserSynchronizationService.syncAuth0User({
        sub: auth0User.user_id,
        email: email,
        email_verified: true,
      });

      // 5. Update local session cookies to mark verificationStatus as active
      const response = NextResponse.json({ verified: true }, {
        headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" }
      });
      response.cookies.set("intimo_session_active", syncedUser.id, {
        path: "/",
        httpOnly: false,
        maxAge: 86400 * 7,
      });
      response.cookies.set("intimo_user_data", JSON.stringify({
        id: syncedUser.id,
        auth0_user_id: syncedUser.auth0_user_id,
        email: syncedUser.email,
        username: auth0User.nickname || auth0User.name || syncedUser.email.split("@")[0],
        avatarUrl: auth0User.picture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
        email_verified: true,
      }), {
        path: "/",
        httpOnly: false,
        maxAge: 86400 * 7,
      });

      return response;
    }

    return NextResponse.json({ verified: false }, {
      headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" }
    });
  } catch (err: any) {
    console.error("Error in verification poll route:", err);
    return NextResponse.json({ verified: false, error: err.message }, {
      status: 500,
      headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" }
    });
  }
}
