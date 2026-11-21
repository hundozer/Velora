import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { grantIsActive } from "@/lib/privateAccess.mjs";

// Lists an owner's private photos for a viewer with an active grant (P1-06).
// Each URL is the authenticated /api/media/{id} route, which re-checks the grant
// on every read and proxies re-encoded bytes: no storage URL ever reaches the browser.
export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  const auth = await resolveServerActor(req);
  if (auth.status !== "authenticated") return NextResponse.json({ error: "Authentication required" }, { status: auth.status === "unauthenticated" ? 401 : 503 });
  if (!hasAdultAccess(auth.actor)) return NextResponse.json({ error: "Adult access verification required" }, { status: 403 });
  const ownerId = new URL(req.url).searchParams.get("ownerId") || "";
  if (!UUID.test(ownerId)) return NextResponse.json({ error: "Invalid member" }, { status: 400 });
  const db = getServerSupabase();
  if (!db) return NextResponse.json({ error: "Private photos unavailable" }, { status: 503 });

  const isOwner=ownerId===auth.actor.profileId;
  if (!isOwner) {
    const {data:owner,error:ownerError}=await db.from("profiles")
      .select("account_status,age_verification_status,discovery_disabled")
      .eq("id",ownerId).maybeSingle();
    if(ownerError||!owner||owner.account_status!=="ACTIVE"||
       owner.age_verification_status!=="AGE_VERIFIED"||owner.discovery_disabled)
      return NextResponse.json({error:"No access"},{status:403});
    const {data:block,error:blockError}=await db.from("user_blocks").select("id")
      .or(`and(blocker_id.eq.${auth.actor.profileId},blocked_profile_id.eq.${ownerId}),and(blocker_id.eq.${ownerId},blocked_profile_id.eq.${auth.actor.profileId})`)
      .limit(1).maybeSingle();
    if(blockError||block)return NextResponse.json({error:"No access"},{status:403});
  }
  const {data:grants,error:grantError}=isOwner?{data:null,error:null}
    :await db.from("album_viewer_grants").select("album_id,expires_at")
      .eq("viewer_id",auth.actor.profileId).limit(100);
  if(grantError)return NextResponse.json({error:"Private albums unavailable"},{status:503});
  const activeIds=(grants||[]).filter(g=>!g.expires_at||Date.parse(g.expires_at)>Date.now()).map(g=>g.album_id);
  let query=db.from("media_albums").select("id,title,cover_media_id,updated_at")
    .eq("owner_id",ownerId).eq("visibility","PRIVATE_APPROVED")
    .eq("moderation_status","APPROVED").order("updated_at",{ascending:false}).limit(30);
  if(!isOwner){
    if(!activeIds.length)return NextResponse.json({media:[],albums:[]},{headers:{"Cache-Control":"private, no-store"}});
    query=query.in("id",activeIds);
  }
  const {data:albums,error:albumError}=await query;
  if(albumError)return NextResponse.json({error:"Private albums unavailable"},{status:503});
  const coverIds=[...new Set((albums||[]).map(a=>a.cover_media_id).filter((id):id is string=>Boolean(id)))];
  const {data:links,error:linkError}=coverIds.length?
    await db.from("media_album_items").select("album_id,media_id").in("media_id",coverIds):
    {data:[],error:null};
  if(linkError)return NextResponse.json({error:"Private albums unavailable"},{status:503});
  const allowedCovers=new Set((links||[]).filter(link=>(albums||[]).some(a=>a.id===link.album_id)).map(link=>link.media_id));
  return NextResponse.json({
    media:[],
    albums:(albums||[]).map(album=>({
      id:album.id,title:album.title,
      coverUrl:album.cover_media_id&&allowedCovers.has(album.cover_media_id)?`/api/media/${album.cover_media_id}`:null
    }))
  },{headers:{"Cache-Control":"private, no-store"}});

}
