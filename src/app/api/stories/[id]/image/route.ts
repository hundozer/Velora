import { NextRequest } from "next/server";
import { storyActor, storyJson, uuid } from "@/lib/stories/server";
import { deliverMedia } from "@/lib/media/delivery";
import { checkRateLimit } from "@/lib/security/rateLimiter";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest,{params}:{params:{id:string}}) {
 const access=await storyActor(req);if(!access.ok)return access.response;
 if(!uuid.test(params.id))return storyJson({error:"Story unavailable"},404);
 const {db,actor}=access;
 if(!(await checkRateLimit(`story-image:${actor.userId}`,120,60)).allowed)return storyJson({error:"Try again shortly"},429);
 const {data:allowed,error}=await db.rpc("intimo_story_visible",{p_viewer:actor.profileId,p_story:params.id});
 if(error||allowed!==true)return storyJson({error:"Story unavailable"},404);
 const {data:story,error:storyError}=await db.from("member_stories").select("media_id").eq("id",params.id).single();
 if(storyError||!story)return storyJson({error:"Story unavailable"},404);
 const {data:media,error:mediaError}=await db.from("media_objects").select("object_key,mime_type").eq("id",story.media_id).single();
 if(mediaError||!media)return storyJson({error:"Story unavailable"},404);
 // Deliver sanitised bytes, never reusable storage URLs or untouched originals.
 try{return await deliverMedia(media.object_key,media.mime_type);}catch{return storyJson({error:"Story photo unavailable"},503);}
}
