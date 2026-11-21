import { NextRequest, NextResponse } from "next/server";
import { hasAdultAccess, resolveServerActor } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { appendDurableAudit } from "@/lib/auth/durableAudit";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const noStore = { "Cache-Control": "private, no-store" };
const reply = (body: unknown, status=200) => NextResponse.json(body, {status,headers:noStore});

async function context(req:NextRequest, albumId:string) {
  const auth = await resolveServerActor(req);
  if (auth.status !== "authenticated" || !hasAdultAccess(auth.actor))
    return { error: reply({error:"Sign in and complete verification"},403) };
  if (!UUID.test(albumId)) return {error:reply({error:"Album not found"},404)};
  const db = getServerSupabase();
  if (!db) return {error:reply({error:"Album access unavailable"},503)};
  const {data:album,error}=await db.from("media_albums")
    .select("id,owner_id,visibility,moderation_status")
    .eq("id",albumId).eq("owner_id",auth.actor.profileId).maybeSingle();
  if(error || !album) return {error:reply({error:"Album not found"},404)};
  if(album.visibility!=="PRIVATE_APPROVED" || album.moderation_status==="REMOVED")
    return {error:reply({error:"Access can only be managed for private albums"},409)};
  return {db,actor:auth.actor,album};
}

export async function GET(req:NextRequest,{params}:{params:{id:string}}){
  const ctx=await context(req,params.id);if("error" in ctx)return ctx.error;
  const {data,error}=await ctx.db.from("album_viewer_grants")
    .select("viewer_id,granted_at,expires_at").eq("album_id",params.id).limit(200);
  if(error)return reply({error:"Access list unavailable"},502);
  const live=(data||[]).filter(row=>!row.expires_at||Date.parse(row.expires_at)>Date.now());
  const ids=live.map(row=>row.viewer_id);
  const profiles=ids.length?await ctx.db.from("profiles").select("id,username,display_name")
    .in("id",ids):{data:[],error:null};
  if(profiles.error)return reply({error:"Access list unavailable"},502);
  const names=new Map((profiles.data||[]).map(row=>[row.id,row.username||row.display_name||"Member"]));
  return reply({viewers:live.filter(row=>names.has(row.viewer_id)).map(row=>({
    id:row.viewer_id,name:names.get(row.viewer_id),expiresAt:row.expires_at
  }))});
}

export async function POST(req:NextRequest,{params}:{params:{id:string}}){
  const ctx=await context(req,params.id);if("error" in ctx)return ctx.error;
  if(!(await checkRateLimit(`album-approve:${ctx.actor.userId}`,20,3600)).allowed)
    return reply({error:"Too many requests"},429);
  const origin=req.headers.get("origin");
  if(origin && origin!==new URL(req.url).origin)return reply({error:"Invalid origin"},403);
  if(Number(req.headers.get("content-length")||0)>512)return reply({error:"Request too large"},413);
  let body:unknown;try{body=await req.json();}catch{return reply({error:"Invalid request"},400)}
  const username=typeof (body as {username?:unknown})?.username==="string"?(body as {username:string}).username.trim():"";
  if(!/^[a-zA-Z0-9_.-]{2,60}$/.test(username))return reply({error:"Enter an exact member username"},400);
  const {data:user,error:userError}=await ctx.db.from("profiles")
    .select("id,account_status,age_verification_status,is_demo,discovery_disabled")
    .eq("username",username).maybeSingle();
  if(userError||!user||user.id===ctx.actor.profileId||user.account_status!=="ACTIVE"
    ||user.age_verification_status!=="AGE_VERIFIED"||user.is_demo||user.discovery_disabled)
    return reply({error:"Member unavailable"},404);
  const {data:block,error:blockError}=await ctx.db.from("user_blocks").select("id")
    .or(`and(blocker_id.eq.${user.id},blocked_profile_id.eq.${ctx.actor.profileId}),and(blocker_id.eq.${ctx.actor.profileId},blocked_profile_id.eq.${user.id})`)
    .limit(1).maybeSingle();
  if(blockError||block)return reply({error:"Member unavailable"},404);
  const {error}=await ctx.db.from("album_viewer_grants").upsert({album_id:params.id,viewer_id:user.id,expires_at:null},{onConflict:"album_id,viewer_id"});
  if(error)return reply({error:"Access could not be approved"},502);
  const audit=await appendDurableAudit(ctx.db,{actorProfileId:ctx.actor.profileId,actorUserId:ctx.actor.userId,action:"ALBUM_VIEWER_APPROVE",resourceType:"ALBUM",resourceId:params.id,outcome:"SUCCESS",metadata:{viewerId:user.id}});
  if(!audit)return reply({error:"Access saved but audit unavailable"},503);
  return reply({approved:true,viewerId:user.id});
}

export async function DELETE(req:NextRequest,{params}:{params:{id:string}}){
  const ctx=await context(req,params.id);if("error" in ctx)return ctx.error;
  const origin=req.headers.get("origin");if(origin&&origin!==new URL(req.url).origin)return reply({error:"Invalid origin"},403);
  let body:unknown;try{body=await req.json();}catch{return reply({error:"Invalid request"},400)}
  const viewerId=(body as {viewerId?:unknown})?.viewerId;
  if(typeof viewerId!=="string"||!UUID.test(viewerId))return reply({error:"Invalid member"},400);
  const {error}=await ctx.db.from("album_viewer_grants").delete().eq("album_id",params.id).eq("viewer_id",viewerId);
  if(error)return reply({error:"Could not revoke access"},502);
  const audit=await appendDurableAudit(ctx.db,{actorProfileId:ctx.actor.profileId,actorUserId:ctx.actor.userId,action:"ALBUM_VIEWER_REVOKE",resourceType:"ALBUM",resourceId:params.id,outcome:"SUCCESS",metadata:{viewerId}});
  if(!audit)return reply({error:"Access revoked but audit unavailable"},503);
  return reply({revoked:true});
}
