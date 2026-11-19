import {NextRequest,NextResponse} from "next/server";
import {getServerSupabase} from "@/lib/supabase/server";
import {eraseExpiredAgeReviewSelfies} from "@/lib/privacy/retention";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 const secret=process.env.CRON_SECRET;
 if(!secret || req.headers.get("authorization")!==`Bearer ${secret}`)
   return NextResponse.json({error:"Unauthorized"},{status:401});
 const db=getServerSupabase();
 if(!db)return NextResponse.json({error:"Unavailable"},{status:503});
 try{
   const result=await eraseExpiredAgeReviewSelfies(db);
   if(result.failed)return NextResponse.json({error:"Some age evidence could not be deleted",...result},{status:503,headers:{"Cache-Control":"no-store"}});
   return NextResponse.json(result,{headers:{"Cache-Control":"no-store"}});
 }catch{return NextResponse.json({error:"Age evidence retention unavailable"},{status:503});}
}
