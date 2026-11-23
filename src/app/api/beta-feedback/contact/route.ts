import {NextRequest,NextResponse} from "next/server";
import {resolveServerActor,hasAdultAccess} from "@/lib/auth/serverActor";
import {getServerSupabase} from "@/lib/supabase/server";
import {checkRateLimit} from "@/lib/security/rateLimiter";
import {BETA_FEEDBACK_OPEN_AT,BETA_FEEDBACK_CLOSE_AT} from "@/lib/betaFeedback";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store"};
export async function POST(req:NextRequest){
 const session=await resolveServerActor(req);
 if(session.status!=="authenticated"||session.actor.accountStatus!=="ACTIVE"||!hasAdultAccess(session.actor))
   return NextResponse.json({error:"Verified membership required"},{status:403,headers});
 if(Date.now()<Date.parse(BETA_FEEDBACK_OPEN_AT)||Date.now()>=Date.parse(BETA_FEEDBACK_CLOSE_AT))
   return NextResponse.json({error:"Follow-up signups are not open yet."},{status:403,headers});
 const rate=(await checkRateLimit("beta-feedback-contact:"+session.actor.userId,2,86400));
 if(!rate.allowed)return NextResponse.json({error:"Too many requests"},{status:429,headers});
 let input:unknown;
 try{input=await req.json();}catch{return NextResponse.json({error:"Invalid request"},{status:400,headers});}
 if(!input||typeof input!=="object"||Array.isArray(input))return NextResponse.json({error:"Invalid request"},{status:400,headers});
 const v=input as Record<string,unknown>;
 if(v.consent!==true||typeof v.contact!=="string"||v.contact.trim().length<3||v.contact.trim().length>200)
   return NextResponse.json({error:"Contact and explicit permission required"},{status:400,headers});
 const db=getServerSupabase();
 if(!db)return NextResponse.json({error:"Follow-up unavailable"},{status:503,headers});
 // Independent table: not joined to survey answers; no account reference stored.
 const {error}=await db.from("beta_feedback_contacts").insert({contact:v.contact.trim(),consented:true});
 if(error)return NextResponse.json({error:"Could not save follow-up request"},{status:503,headers});
 return NextResponse.json({saved:true},{headers});
}
