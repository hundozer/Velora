import { NextRequest, NextResponse } from "next/server";
import { AUTH0_CONFIG } from "@/lib/auth0/config";
import { deleteProfileByAuthId } from "@/lib/supabase/profileService";
import { auditLogger } from "@/lib/auth/auditLogger";
import { supabase } from "@/lib/supabase/client";

export async function POST(req: NextRequest) {
  try {
    const { auth0UserId, email } = await req.json();

    if (!auth0UserId) {
      return NextResponse.json({ error: "auth0UserId is required" }, { status: 400 });
    }

    console.log(`Starting account deletion workflow for identifier: ${auth0UserId} (email: ${email || "none"})`);

    // 1. Attempt to obtain Auth0 Management API Token
    let auth0Deleted = false;
    let auth0Error = null;
    let targetAuth0Id = auth0UserId;

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

        // 1.1 Resolve the target Auth0 User ID if the input is an internal database ID
        if (!targetAuth0Id.startsWith("auth0|")) {
          console.log(`Identifier '${targetAuth0Id}' is not an Auth0 ID. Resolving...`);
          let searchEmail = email;

          if (!searchEmail) {
            // Query Supabase as a fallback to locate the email
            const { data: profile } = await supabase
              .from("profiles")
              .select("email")
              .eq("auth_id", auth0UserId)
              .single();
            searchEmail = profile?.email;
          }

          if (searchEmail) {
            console.log(`Querying Auth0 for user matching email: ${searchEmail}`);
            const searchRes = await fetch(`${issuer}/api/v2/users-by-email?email=${encodeURIComponent(searchEmail)}`, {
              headers: {
                Authorization: `Bearer ${mToken}`,
              },
            });

            if (searchRes.ok) {
              const users = await searchRes.json();
              if (users && users.length > 0) {
                targetAuth0Id = users[0].user_id;
                console.log(`Successfully resolved internal ID to Auth0 ID: ${targetAuth0Id}`);
              } else {
                console.warn(`No user matching email '${searchEmail}' was found in Auth0`);
              }
            } else {
              console.error(`Auth0 users-by-email lookup failed: ${await searchRes.text()}`);
            }
          }
        }

        // 2. Call Auth0 Management API to Delete the User
        if (targetAuth0Id.startsWith("auth0|")) {
          console.log(`Sending delete request to Auth0 for ID: ${targetAuth0Id}`);
          const deleteRes = await fetch(`${issuer}/api/v2/users/${encodeURIComponent(targetAuth0Id)}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${mToken}`,
            },
          });

          if (deleteRes.ok || deleteRes.status === 404) {
            auth0Deleted = true;
            console.log(`Successfully deleted user ${targetAuth0Id} from Auth0 (or user didn't exist)`);
          } else {
            const deleteErrorText = await deleteRes.text();
            auth0Error = `Auth0 delete call failed: ${deleteErrorText}`;
            console.error(auth0Error);
          }
        } else {
          auth0Error = `Could not resolve a valid Auth0 ID to delete. Target ID remained: ${targetAuth0Id}`;
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

    // 3. Delete from Supabase profiles table using all possible IDs
    await deleteProfileByAuthId(auth0UserId);
    if (targetAuth0Id !== auth0UserId) {
      await deleteProfileByAuthId(targetAuth0Id);
    }

    auditLogger.logEvent({
      actorId: auth0UserId,
      actorRole: "MEMBER",
      action: "GDPR_DELETE_ACCOUNT",
      status: auth0Deleted ? "SUCCESS" : "ERROR",
      details: { auth0UserId, targetAuth0Id, email, auth0Deleted, auth0Error },
    });

    return NextResponse.json({
      success: true,
      auth0Deleted,
      message: auth0Deleted 
        ? "Account permanently deleted from identity provider and database." 
        : `Profile deleted from database. Please sign in (rather than sign up) if you connect again. Details: ${auth0Error}`
    });
  } catch (err: any) {
    console.error("Error in delete-account API:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
