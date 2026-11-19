import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/adminApi";
import { getServerSupabase } from "@/lib/supabase/server";
import { appendDurableAudit } from "@/lib/auth/durableAudit";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
 const guard = await requireAdminPermission(req, "users:view_sensitive");
 if ("response" in guard) return guard.response;
 const db = getServerSupabase();
 if (!db) return NextResponse.json({ error:"Unavailable" },{status:503,headers});
 const { data, error } = await db.from("invitation_codes")
   .select("id,source_label,owner_name,owner_profile_id,max_uses,uses,expires_at,revoked_at,created_at")
   .order("created_at",{ascending:false}).limit(300);
 if (error) return NextResponse.json({error:"Unable to load codes"},{status:503,headers});
 return NextResponse.json({codes:data ?? []},{headers});
}

export async function POST(req: NextRequest) {
 const guard = await requireAdminPermission(req, "users:view_sensitive");
 if ("response" in guard) return guard.response;
 let payload: Record<string,unknown>;
 try { payload = await req.json(); } catch { return NextResponse.json({error:"Invalid request"},{status:400,headers}); }
 const source = typeof payload.sourceLabel === "string" ? payload.sourceLabel.trim() : "";
 const owner = typeof payload.ownerName === "string" ? payload.ownerName.trim() : "";
 const quantity = Number(payload.quantity);
 const maxUses = Number(payload.maxUses);
 const expiry = typeof payload.expiresAt === "string" ? new Date(payload.expiresAt) : new Date(NaN);
 const ownerProfileId = typeof payload.ownerProfileId === "string" && UUID.test(payload.ownerProfileId) ? payload.ownerProfileId : null;
 if (!source || source.length>120 || !owner || owner.length>120 ||
     !Number.isInteger(quantity) || quantity<1 || quantity>50 ||
     !Number.isInteger(maxUses) || maxUses<1 || maxUses>1000 ||
     !Number.isFinite(expiry.getTime()) || expiry.getTime()<=Date.now() ||
     expiry.getTime()>Date.now()+90*86400000) {
   return NextResponse.json({error:"Check owner, source, quantity, uses and expiry (maximum 90 days)"},{status:400,headers});
 }
 const db = getServerSupabase();
 if (!db) return NextResponse.json({error:"Unavailable"},{status:503,headers});
 const codes = Array.from({length:quantity},()=>randomBytes(32).toString("base64url"));
 const rows = codes.map(code=>({
   code_sha256:createHash("sha256").update(code).digest("hex"),
   source_label:source,owner_name:owner,owner_profile_id:ownerProfileId,
   max_uses:maxUses,expires_at:expiry.toISOString(),created_by:guard.actor.profileId
 }));
 const {data,error} = await db.from("invitation_codes").insert(rows).select("id");
 if (error || !data || data.length!==quantity) return NextResponse.json({error:"Codes could not be created"},{status:503,headers});
 const ok = await appendDurableAudit(db,{
   actorProfileId:guard.actor.profileId,actorUserId:guard.actor.userId,
   action:"INVITATION_CODES_CREATE",resourceType:"INVITATION_CODES",resourceId:data[0].id,
   outcome:"SUCCESS",metadata:{quantity,maxUses,source,owner,expiresAt:expiry.toISOString()}
 });
 if (!ok) return NextResponse.json({error:"Codes were created but auditing failed. Contact an administrator before retrying."},{status:502,headers});
 const origin=process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/,"") || new URL(req.url).origin;
 return NextResponse.json({links:codes.map((code,index)=>({id:data[index].id,url:`${origin}/register?invite=${encodeURIComponent(code)}`}))},{headers});
}

export async function PATCH(req: NextRequest) {
 const guard=await requireAdminPermission(req,"users:view_sensitive");
 if ("response" in guard) return guard.response;
 const body=await req.json().catch(()=>null);
 if (!body || typeof body.id!=="string" || !UUID.test(body.id) || body.action!=="revoke")
   return NextResponse.json({error:"Invalid request"},{status:400,headers});
 const db=getServerSupabase();
 if (!db) return NextResponse.json({error:"Unavailable"},{status:503,headers});
 const {data,error}=await db.from("invitation_codes").update({revoked_at:new Date().toISOString()})
    .eq("id",body.id).is("revoked_at",null).select("id").maybeSingle();
 if (error) return NextResponse.json({error:"Could not revoke"},{status:503,headers});
 if (!data) return NextResponse.json({error:"Already revoked or missing"},{status:409,headers});
 const ok=await appendDurableAudit(db,{actorProfileId:guard.actor.profileId,actorUserId:guard.actor.userId,
   action:"INVITATION_CODE_REVOKE",resourceType:"INVITATION_CODE",resourceId:body.id,outcome:"SUCCESS",metadata:{}});
 if (!ok) return NextResponse.json({error:"Revoked but audit failed"},{status:502,headers});
 return NextResponse.json({revoked:true},{headers});
}
