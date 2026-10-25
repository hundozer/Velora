import type { SupabaseClient } from "@supabase/supabase-js";
import { deleteStoredObject, deleteVariantObjects } from "@/lib/storage/r2";
/** Called by the existing protected retention runner; delivery expires independently. */
export async function cleanupStoryPhotos(db:SupabaseClient){
 const now=new Date().toISOString();const dayAgo=new Date(Date.now()-86400000).toISOString();
 const {data:photos,error}=await db.from("media_objects").select("id,owner_id,object_key").eq("category","STORY").lt("created_at",dayAgo).order("created_at").limit(50);
 if(error)return {removed:0,failed:1,held:0};
 let removed=0,failed=0,held=0;
 for(const photo of photos||[]){
  const {data:story,error:storyError}=await db.from("member_stories").select("expires_at,deleted_at").eq("media_id",photo.id).maybeSingle();
  if(storyError){failed++;continue;}
  if(story&&!story.deleted_at&&story.expires_at>now)continue;
  const {data:hold,error:holdError}=await db.from("retention_holds").select("id").eq("profile_id",photo.owner_id).eq("status","ACTIVE").limit(1).maybeSingle();
  if(holdError){failed++;continue;}if(hold){held++;continue;}
  try{
   await deleteStoredObject(photo.object_key);await deleteVariantObjects(photo.id);
   const {error:deleted}=await db.from("media_objects").delete().eq("id",photo.id).eq("category","STORY");
   if(deleted)throw deleted;removed++;
  }catch{failed++;}
 }
 return {removed,failed,held};
}
