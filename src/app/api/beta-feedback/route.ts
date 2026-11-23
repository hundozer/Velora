import {NextRequest,NextResponse} from "next/server";
import {resolveServerActor,hasAdultAccess} from "@/lib/auth/serverActor";
import {getServerSupabase} from "@/lib/supabase/server";
import {checkRateLimit} from "@/lib/security/rateLimiter";
import {BETA_FEEDBACK_OPEN_AT,BETA_FEEDBACK_CLOSE_AT,validateBetaFeedback} from "@/lib/betaFeedback";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store"};
export async function POST(req:NextRequest){
 const session=await resolveServerActor(req);
 if(session.status!=="authenticated"||session.actor.accountStatus!=="ACTIVE"||!hasAdultAccess(session.actor))
   return NextResponse.json({error:"Verified membership required"},{status:403,headers});
 const now=Date.now();
 if(now<Date.parse(BETA_FEEDBACK_OPEN_AT)||now>=Date.parse(BETA_FEEDBACK_CLOSE_AT))
   return NextResponse.json({error:"The beta questionnaire is not open yet."},{status:403,headers});
 const rate=(await checkRateLimit("beta-feedback:"+session.actor.userId,2,86400));
 if(!rate.allowed)return NextResponse.json({error:"Feedback submitted too frequently."},{status:429,headers});
 const size=Number(req.headers.get("content-length")||0);
 if(size>20000)return NextResponse.json({error:"Submission too large"},{status:413,headers});
 let body:unknown;
 try{body=await req.json();}catch{return NextResponse.json({error:"Invalid JSON"},{status:400,headers});}
 if(!body||typeof body!=="object"||Array.isArray(body))return NextResponse.json({error:"Invalid response"},{status:400,headers});
 const input=body as Record<string,unknown>;
 const answers=validateBetaFeedback(input.answers);
 if(!answers||!["en","cs"].includes(String(input.language))||JSON.stringify(body).length>20000)
   return NextResponse.json({error:"Invalid answers"},{status:400,headers});
 if(!Object.values(answers).some(x=>x!==null))
   return NextResponse.json({error:"Answer at least one question"},{status:400,headers});
 const db=getServerSupabase();
 if(!db)return NextResponse.json({error:"Survey service unavailable"},{status:503,headers});
 // Do not record actor ID, email, IP, user agent or session with answers.
 const {error}=await db.from("beta_feedback_responses").insert({language:input.language,answers});
 if(error)return NextResponse.json({error:"Could not save feedback"},{status:503,headers});
 return NextResponse.json({saved:true},{headers});
}
