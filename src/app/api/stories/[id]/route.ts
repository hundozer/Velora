import { NextRequest } from "next/server";
import { storyActor, storyJson, uuid } from "@/lib/stories/server";
import { deleteStoredObject, deleteVariantObjects } from "@/lib/storage/r2";
export const dynamic="force-dynamic";
export async function POST(req:NextRequest,{params}:{params:{id:string}}) {
 const access=await storyActor(req);if(!access.ok)return access.response;
 if(!uuid.test(params.id))return storyJson({error:"Story unavailable"},404);
 const {data,error}=await access.db.rpc("intimo_view_story",{p_viewer:access.actor.profileId,p_story:params.id});
 return error||data!==true?storyJson({error:"Story unavailable"},404):storyJson({viewed:true});
}
export async function DELETE(req:NextRequest,{params}:{params:{id:string}}) {
 const access=await storyActor(req);if(!access.ok)return access.response;
 if(!uuid.test(params.id))return storyJson({error:"Story unavailable"},404);
 const {db,actor}=access;
 const {data:story,error}=await db.from("member_stories").update({deleted_at:new Date().toISOString()}).eq("id",params.id).eq("owner_id",actor.profileId).select("media_id").maybeSingle();
 if(error)return storyJson({error:"Story deletion failed"},502);
 if(!story)return storyJson({error:"Story unavailable"},404);
 const {data:hold,error:holdError}=await db.from("retention_holds").select("id").eq("profile_id",actor.profileId).eq("status","ACTIVE").limit(1).maybeSingle();
 if(holdError)return storyJson({error:"Story is hidden; retention lookup needs a retry"},502);
 if(hold)return storyJson({deleted:true,retained:true});
 const {data:media,error:lookup}=await db.from("media_objects").select("object_key").eq("id",story.media_id).eq("owner_id",actor.profileId).single();
 if(lookup||!media)return storyJson({error:"Story is hidden; photo cleanup needs a retry"},502);
 try{await deleteStoredObject(media.object_key);await deleteVariantObjects(story.media_id);}catch{return storyJson({error:"Story is hidden; photo cleanup needs a retry"},502);}
 const {error:removed}=await db.from("media_objects").delete().eq("id",story.media_id).eq("owner_id",actor.profileId);
 return removed?storyJson({error:"Story is hidden; cleanup needs a retry"},502):storyJson({deleted:true});
}
