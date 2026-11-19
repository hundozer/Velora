import { NextRequest, NextResponse } from "next/server";
import { resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
const headers = {"Cache-Control":"private, no-store"};
// An owner can see only totals, never redeemed identities or token hashes.
export async function GET(req:NextRequest){
 const result=await resolveServerActor(req);
 if(result.status!=="authenticated" || result.actor.accountStatus!=="ACTIVE")
   return NextResponse.json({error:"Member access required"},{status:403,headers});
 const db=getServerSupabase();
 if(!db)return NextResponse.json({error:"Unavailable"},{status:503,headers});
 const {data,error}=await db.from("invitation_codes")
   .select("source_label,max_uses,uses,expires_at,revoked_at")
   .eq("owner_profile_id",result.actor.profileId).limit(500);
 if(error)return NextResponse.json({error:"Unavailable"},{status:503,headers});
 const totals=(data??[]).reduce((acc,row)=>{
   acc.issued+=1;acc.capacity+=row.max_uses;acc.joined+=row.uses;
   if(!row.revoked_at && new Date(row.expires_at).getTime()>Date.now() && row.uses<row.max_uses)acc.active+=1;
   return acc;
 },{issued:0,capacity:0,joined:0,active:0});
 return NextResponse.json({totals},{headers});
}
