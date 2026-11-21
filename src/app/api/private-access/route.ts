import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";

// Retired: owner-wide private photo grants are no longer a user-facing permission.
// Only per-album /api/albums/[id]/access grants authorize private album files.
export const dynamic = "force-dynamic";
async function retired(req:NextRequest) {
  const auth=await resolveServerActor(req);
  if(auth.status!=="authenticated"||!hasAdultAccess(auth.actor))
    return NextResponse.json({error:"Adult verified member required"},{status:403});
  return NextResponse.json({error:"Private-photo sharing is now managed separately for each private album.",manageUrl:"/albums/manage"},{status:410,headers:{"Cache-Control":"private, no-store"}});
}
export const GET=retired;
export const POST=retired;
export const PATCH=retired;
