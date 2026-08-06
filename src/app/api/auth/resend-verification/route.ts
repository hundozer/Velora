import { NextRequest, NextResponse } from "next/server";
import { AUTH0_CONFIG } from "@/lib/auth0/config";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const cookieUserDataVal = req.cookies.get("intimo_user_data")?.value;
    if (!cookieUserDataVal) {
      return NextResponse.json({ success: false, error: "No active session cookie found" }, { status: 401 });
    }

    const cookieUserData = JSON.parse(decodeURIComponent(cookieUserDataVal));
    const auth0UserId = cookieUserData.auth0_user_id;
    const email = cookieUserData.email;

    if (!email) {
      return NextResponse.json({ success: false, error: "No email address found in session" }, { status: 400 });
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
      console.error("Failed to fetch Auth0 Management token for resend job:", await tokenRes.text());
      return NextResponse.json({ success: false, error: "Identity provider authentication failed" }, { status: 500 });
    }

    const tokenData = await tokenRes.json();
    const mToken = tokenData.access_token;

    // 2. Resolve Auth0 User ID (prefer exact session ID, fall back to email search)
    let targetAuth0Id = auth0UserId;
    if (!targetAuth0Id || !targetAuth0Id.startsWith("auth0|")) {
      console.log(`Auth0 ID not found in cookie for resend. Searching by email: ${email}`);
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
      return NextResponse.json({ success: false, error: "Could not locate Auth0 account profile" }, { status: 404 });
    }

    // 3. Call Auth0 jobs/verification-email endpoint to trigger a real verification email
    console.log(`Sending Auth0 resend verification email job for user ID: ${targetAuth0Id}`);
    const jobRes = await fetch(`${issuer}/api/v2/jobs/verification-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mToken}`,
      },
      body: JSON.stringify({
        user_id: targetAuth0Id,
        client_id: AUTH0_CONFIG.clientId,
      }),
    });

    if (!jobRes.ok) {
      const errorText = await jobRes.text();
      console.error(`Auth0 verification resend job failed: ${errorText}`);
      return NextResponse.json({ success: false, error: `Auth0 job resend failed: ${errorText}` }, { status: 500 });
    }

    console.log(`Auth0 resend verification email successfully triggered for: ${email}`);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Exception in resend-verification API:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
