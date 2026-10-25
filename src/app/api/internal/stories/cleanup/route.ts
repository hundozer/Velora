import {createHmac,timingSafeEqual} from "node:crypto";
import {NextRequest,NextResponse} from "next/server";
import {getServerSupabase} from "@/lib/supabase/server";
import {cleanupStoryPhotos} from "@/lib/stories/cleanup";
export const dynamic="force-dynamic";
export const maxDuration=60;
export async function POST(req:NextRequest){
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 const supplied=(req.headers.get("authorization")||"").replace(/^Bearer /,"");
 const expected=key?createHmac("sha256",key).update("intimo-story-cleanup-v1").digest("hex"):"";
 if(!expected||supplied.length!==expected.length||!timingSafeEqual(Buffer.from(supplied),Buffer.from(expected)))return NextResponse.json({error:"Not found"},{status:404});
 const db=getServerSupabase();if(!db)return NextResponse.json({error:"Cleanup unavailable"},{status:503});
 try{const result=await cleanupStoryPhotos(db);return NextResponse.json(result,{status:result.failed?502:200,headers:{"Cache-Control":"no-store"}});}
 catch{return NextResponse.json({error:"Cleanup unavailable"},{status:503});}
}
