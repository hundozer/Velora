import { NextRequest, NextResponse } from "next/server";
import { resolveServerActor, hasAdultAccess } from "@/lib/auth/serverActor";
import { getServerSupabase } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
export async function GET(req: NextRequest) {
 const identity = await resolveServerActor(req);
 if (identity.status !== "authenticated" || identity.actor.accountStatus !== "ACTIVE" ||
     !identity.actor.emailVerified || !hasAdultAccess(identity.actor))
   return NextResponse.json({ allowed: false }, { status: 403, headers });
 const db = getServerSupabase();
 if (!db) return NextResponse.json({ error: "Workspace unavailable" }, { status: 503, headers });
 const { data: grant, error: grantError } = await db.from("collaborator_workspaces")
    .select("workspace").eq("profile_id",identity.actor.profileId).eq("workspace","BETA_COMMUNITY").maybeSingle();
 if (grantError) return NextResponse.json({ error: "Workspace unavailable" }, { status: 503, headers });
 if (!grant) return NextResponse.json({ allowed: false }, { status: 403, headers });
 const [codes, surveys] = await Promise.all([
  db.from("invitation_codes").select("uses,max_uses,expires_at,revoked_at,source_label")
    .eq("owner_profile_id",identity.actor.profileId).like("source_label","Carolinka — Invite %").limit(100),
  db.from("beta_feedback_responses").select("answers").limit(500),
 ]);
 if (codes.error || surveys.error) return NextResponse.json({error:"Workspace metrics unavailable"},{status:503,headers});
 const active = (codes.data||[]).filter(c=>!c.revoked_at);
 const joined = active.reduce((n,c)=>n+c.uses,0);
 const available = active.filter(c=>c.uses<c.max_uses && new Date(c.expires_at).getTime()>Date.now()).length;
 const answers = surveys.data||[];
 // Never expose raw replies, contact details or individual members in this workspace.
 // Aggregate answers are suppressed until a meaningful privacy threshold is met.
 const enough = answers.length>=5;
 const scale = (id:number) => {
   if(!enough)return null;
   const scores=answers.map(row=>(row.answers as Record<string,unknown>)?.["q"+id]).filter((v):v is number=>typeof v==="number");
   return scores.length>=5 ? {mean: Math.round(scores.reduce((a,b)=>a+b,0)/scores.length*10)/10, responses:scores.length} : null;
 };
 const tone = enough ? ["too_tame","just_right","too_much"].map(key=>({
  choice:key, count:answers.filter(r=>(r.answers as Record<string,unknown>)?.q9===key).length
 })) : null;
 return NextResponse.json({
   allowed:true, workspace:"BETA_COMMUNITY",
   invites:{issued:active.length,joined,unused:available,expiresAt:"2026-12-31"},
   survey:{responses:answers.length,resultsReady:enough,safety:scale(8),control:scale(5),recommendation:scale(12),tone},
   schedule:{firstBatch:"2026-12-07",surveyOpens:"2026-12-15",betaEnds:"2026-12-31",launch:"2027-01"}
 },{headers});
}
