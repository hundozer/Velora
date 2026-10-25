import { NextRequest } from "next/server";
import { storyActor, storyJson, uuid } from "@/lib/stories/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
export const dynamic = "force-dynamic";
type Row = { id: string; owner_id: string; media_id: string; caption: string; audience: string; expires_at: string; created_at: string; viewed: boolean };
export async function GET(req: NextRequest) {
 const access = await storyActor(req); if (!access.ok) return access.response;
 const { db, actor } = access;
 const owners = req.nextUrl.searchParams.get("owners")?.split(",") ?? null;
 if (owners && (owners.length>50 || owners.some(id=>!uuid.test(id)))) return storyJson({ error: "Invalid story owners" },400);
 if (!(await checkRateLimit(`stories-read:${actor.userId}`,180,60)).allowed) return storyJson({ error: "Try again shortly" },429);
 if (req.nextUrl.searchParams.get("mine")==="true") {
  const {data,error}=await db.from("member_stories").select("id,caption,audience,expires_at,created_at,deleted_at,media_objects(moderation_status)").eq("owner_id",actor.profileId).gt("expires_at",new Date().toISOString()).order("created_at",{ascending:false});
  return error?storyJson({error:"Stories unavailable"},502):storyJson({stories:data});
 }
 const { data, error } = await db.rpc("intimo_story_list",{p_viewer:actor.profileId,p_owners:owners});
 if (error) return storyJson({error:"Stories unavailable"},502);
 const rows=(data||[]) as Row[];
 if(req.nextUrl.searchParams.get("summary")==="true") {
  const summary:Record<string,{unread:boolean;expiresAt:string}>={};
  for(const row of rows) {
   const previous=summary[row.owner_id];
   summary[row.owner_id]={unread:!row.viewed||Boolean(previous?.unread),expiresAt:previous&&previous.expiresAt<row.expires_at?previous.expiresAt:row.expires_at};
  }
  return storyJson({summary});
 }
 const ids=[...new Set(rows.map(r=>r.owner_id))];
 const profiles=ids.length?await db.from("profiles").select("id,display_name,avatar_url").in("id",ids):{data:[],error:null};
 if(profiles.error)return storyJson({error:"Stories unavailable"},502);
 return storyJson({stories:rows.map(row=>({id:row.id,ownerId:row.owner_id,mediaId:row.media_id,caption:row.caption,audience:row.audience,expiresAt:row.expires_at,viewed:row.viewed,owner:profiles.data?.find(p=>p.id===row.owner_id),url:`/api/stories/${row.id}/image`}))});
}
export async function POST(req: NextRequest) {
 const access=await storyActor(req);if(!access.ok)return access.response;
 const {db,actor}=access;
 if(!(await checkRateLimit(`story-publish:${actor.userId}`,20,3600)).allowed)return storyJson({error:"Story limit reached"},429);
 let body;try{body=await req.json();}catch{return storyJson({error:"Invalid story"},400);}
 if(!body||typeof body!=="object"||Array.isArray(body))return storyJson({error:"Invalid story"},400);
 const recipients=Array.isArray(body.recipients)?[...new Set(body.recipients)]:[];
 const caption=typeof body.caption==="string"?body.caption.trim():"";
 if(!uuid.test(body.mediaId??"")||caption.length>240||!["MEMBERS","FRIENDS","SELECTED"].includes(body.audience)||body.confirmPublish!==true||
 recipients.length>20||recipients.some(id=>typeof id!=="string"||!uuid.test(id)||id===actor.profileId)||
 (body.audience==="SELECTED"?recipients.length===0:recipients.length!==0))return storyJson({error:"Choose a photo, audience and confirm publication"},400);
 const {data,error}=await db.rpc("intimo_publish_story",{p_owner:actor.profileId,p_media:body.mediaId,p_caption:caption,p_audience:body.audience,p_recipients:recipients});
 if(error)return storyJson({error:"Story could not be published. Check your active stories before retrying."},409);
 return storyJson({id:data},201);
}
