import { NextRequest, NextResponse } from "next/server";
import { AUTH0_CONFIG } from "@/lib/auth0/config";
import { deleteProfileByAuthId } from "@/lib/supabase/profileService";
import { auditLogger } from "@/lib/auth/auditLogger";

export async function POST(req: NextRequest) {
  try {
    const { auth0UserId } = await req.json();

    if (!auth0UserId) {
      return NextResponse.json({ error: "auth0UserId is required" }, { status: 400 });
    }

    console.log(`Starting account deletion workflow for user: ${auth0UserId}`);

    // 1. Attempt to obtain Auth0 Management API Token
    let auth0Deleted = false;
    let auth0Error = null;

    try {
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

      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        const mToken = tokenData.access_token;

        // 2. Call Auth0 Management API to Delete the User
        const deleteRes = await fetch(`${issuer}/api/v2/users/${encodeURIComponent(auth0UserId)}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${mToken}`,
          },
        });

        if (deleteRes.ok || deleteRes.status === 404) {
          auth0Deleted = true;
          console.log(`Successfully deleted user ${auth0UserId} from Auth0 (or user didn't exist)`);
        } else {
          const deleteErrorText = await deleteRes.text();
          auth0Error = `Auth0 delete call failed: ${deleteErrorText}`;
          console.error(auth0Error);
        }
      } else {
        const tokenErrorText = await tokenRes.text();
        auth0Error = `Failed to get Management API token: ${tokenErrorText}`;
        console.error(auth0Error);
      }
    } catch (e: any) {
      auth0Error = `Exception during Auth0 deletion: ${e.message}`;
      console.error(auth0Error);
    }

    // 3. Delete from Supabase profiles table
    const { error: dbError } = await deleteProfileByAuthId(auth0UserId);
    if (dbError) {
      console.error("Database deletion failed:", dbError);
      return NextResponse.json({ error: "Failed to delete user profile from database." }, { status: 500 });
    }

    auditLogger.logEvent({
      actorId: auth0UserId,
      actorRole: "MEMBER",
      action: "GDPR_DELETE_ACCOUNT",
      status: auth0Deleted ? "SUCCESS" : "ERROR",
      details: { auth0Deleted, auth0Error },
    });

    return NextResponse.json({
      success: true,
      auth0Deleted,
      message: auth0Deleted 
        ? "Account permanently deleted from identity provider and database." 
        : "Profile deleted from database. Please sign in (rather than sign up) if you connect again."
    });
  } catch (err: any) {
    console.error("Error in delete-account API:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
