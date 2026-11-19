import {NextRequest,NextResponse} from "next/server";
import {hasAdultAccess,resolveServerActor} from "@/lib/auth/serverActor";
import {getServerSupabase} from "@/lib/supabase/server";
import {checkRateLimit} from "@/lib/security/rateLimiter";
import {isVisibleMember} from "@/lib/auth/ageCheck.mjs";
import {deliverMedia} from "@/lib/media/delivery";
export const dynamic="force-dynamic";
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const hidden=()=>NextResponse.json({error:"Photo unavailable"},{status:404,headers:{"Cache-Control":"private, no-store"}});
/** A view-once image is delivered from this POST only, never via /api/media/{id}.
 * Only one recipient request may claim it. The sender's own media remains viewable.
 */
export async function POST(req:NextRequest){
 const auth=await resolveServerActor(req);
 if(auth.status!=="authenticated" || !hasAdultAccess(auth.actor))return hidden();
 const origin=req.headers.get("origin");
 if(origin && origin!==new URL(req.url).origin)return hidden();
 if(!(await checkRateLimit(`view-once:${auth.actor.userId}`,30,60)).allowed)
   return NextResponse.json({error:"Too many requests"},{status:429});
 const body=await req.json().catch(()=>null);
 const id=typeof body?.messageId==="string" ? body.messageId:"";
 if(!UUID.test(id))return hidden();
 const db=getServerSupabase();if(!db)return hidden();
 const {data:message,error:messageError}=await db.from("direct_messages")
   .select("id,receiver_id,sender_id,attachment_type,media_url,view_once,view_once_opened_at")
   .eq("id",id).eq("receiver_id",auth.actor.profileId).eq("view_once",true)
   .is("view_once_opened_at",null).maybeSingle();
 if(messageError || !message || message.attachment_type!=="IMAGE")return hidden();
 const mediaId=String(message.media_url||"").match(/^\/api\/media\/([0-9a-f-]{36})$/i)?.[1];
 if(!mediaId)return hidden();
 const [{data:media,error:mediaError},{data:viewer,error:viewerError},{data:sender,error:senderError},{data:block,error:blockError}]=await Promise.all([
   db.from("media_objects").select("id,owner_id,object_key,mime_type,upload_status,processing_status,moderation_status,category").eq("id",mediaId).maybeSingle(),
   db.from("profiles").select("display_name").eq("id",auth.actor.profileId).maybeSingle(),
   db.from("profiles").select("account_status,age_verification_status,discovery_disabled").eq("id",message.sender_id).maybeSingle(),
   db.from("user_blocks").select("id").or(`and(blocker_id.eq.${auth.actor.profileId},blocked_profile_id.eq.${message.sender_id}),and(blocker_id.eq.${message.sender_id},blocked_profile_id.eq.${auth.actor.profileId})`).limit(1).maybeSingle()
 ]);
 if(mediaError || viewerError || senderError || blockError || block || !viewer?.display_name ||
    !media || !sender || !isVisibleMember(sender) || sender.discovery_disabled ||
    media.owner_id!==message.sender_id || media.category!=="MESSAGE" ||
    media.upload_status!=="AVAILABLE" || media.processing_status!=="READY" ||
    ["REJECTED","HIDDEN","REMOVED"].includes(media.moderation_status) ||
    !media.mime_type?.startsWith("image/"))return hidden();
 // Prepare bytes before the atomic claim so a storage error does not consume the view.
 let delivery:Response;
 try {delivery=await deliverMedia(media.object_key,media.mime_type,undefined,viewer.display_name);}
 catch {return NextResponse.json({error:"Photo temporarily unavailable"},{status:503,headers:{"Cache-Control":"private, no-store"}});}
 const {data:claimed,error:claimError}=await db.from("direct_messages")
   .update({view_once_opened_at:new Date().toISOString()})
   .eq("id",id).eq("receiver_id",auth.actor.profileId).eq("view_once",true)
   .is("view_once_opened_at",null).select("id").maybeSingle();
 if(claimError || !claimed)return hidden();
 return delivery;
}
