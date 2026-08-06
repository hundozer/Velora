import { NextRequest, NextResponse } from "next/server";
import { AUTH0_CONFIG } from "@/lib/auth0/config";
import { UserSynchronizationService } from "@/lib/auth0/userSync";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Read the user data cookie
    const cookieUserDataVal = req.cookies.get("intimo_user_data")?.value;
    if (!cookieUserDataVal) {
      return NextResponse.json({ verified: false, error: "No active session cookie found" });
    }

    const cookieUserData = JSON.parse(cookieUserDataVal);
    const userId = cookieUserData.id;
    const email = cookieUserData.email;

    if (!userId || !email) {
      return NextResponse.json({ verified: false, error: "Invalid session cookie format" });
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
      return NextResponse.json({ verified: false, error: "Identity provider authentication failed" });
    }

    const tokenData = await tokenRes.json();
    const mToken = tokenData.access_token;

    // 2. Query Auth0 for this user by email (most reliable identity check)
    console.log(`Polling verification status in Auth0 for email: ${email}`);
    const searchRes = await fetch(`${issuer}/api/v2/users-by-email?email=${encodeURIComponent(email)}`, {
      headers: {
        Authorization: `Bearer ${mToken}`,
      },
    });

    if (!searchRes.ok) {
      console.error("Auth0 email search query failed:", await searchRes.text());
      return NextResponse.json({ verified: false, error: "Auth0 user query failed" });
    }

    const users = await searchRes.json();
    if (!users || users.length === 0) {
      return NextResponse.json({ verified: false, error: "User profile not found in Auth0" });
    }

    const auth0User = users[0];
    const isEmailVerified = auth0User.email_verified ?? false;

    if (isEmailVerified) {
      console.log(`User email verified detected for: ${email}`);

      // 3. Synchronize user in local store to set email_verified: true
      const syncedUser = UserSynchronizationService.syncAuth0User({
        sub: auth0User.user_id,
        email: email,
        email_verified: true,
      });

      // 4. Update local session cookies to mark verificationStatus as active
      const response = NextResponse.json({ verified: true });
      response.cookies.set("intimo_session_active", syncedUser.id, {
        path: "/",
        httpOnly: false,
        maxAge: 86400 * 7,
      });
      response.cookies.set("intimo_user_data", JSON.stringify({
        id: syncedUser.id,
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

    return NextResponse.json({ verified: false });
  } catch (err: any) {
    console.error("Error in verification poll route:", err);
    return NextResponse.json({ verified: false, error: err.message }, { status: 500 });
  }
}
