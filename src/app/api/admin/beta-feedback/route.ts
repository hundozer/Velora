import {NextRequest,NextResponse} from "next/server";
import {requireAdminPermission} from "@/lib/auth/adminApi";
import {getServerSupabase} from "@/lib/supabase/server";
import {betaFeedbackQuestions} from "@/lib/betaFeedback";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store"};
function csvCell(value:unknown):string{
 const s=String(value??"");
 // Guard against spreadsheet formula execution when exporting untrusted text.
 const safe=/^[\s]*[=+@\-]/.test(s)?"'"+s:s;
 return '"'+safe.replaceAll('"','""')+'"';
}
export async function GET(req:NextRequest){
 const guard=await requireAdminPermission(req,"users:view_sensitive");
 if("response" in guard)return guard.response;
 const db=getServerSupabase();
 if(!db)return NextResponse.json({error:"Feedback unavailable"},{status:503,headers});
 const [answers,contacts]=await Promise.all([
  db.from("beta_feedback_responses").select("id,language,submitted_at,answers").order("submitted_at",{ascending:false}).limit(500),
  db.from("beta_feedback_contacts").select("id,contact,submitted_at").order("submitted_at",{ascending:false}).limit(200),
 ]);
 if(answers.error||contacts.error)return NextResponse.json({error:"Feedback lookup failed"},{status:503,headers});
 const rows=answers.data??[];
 if(req.nextUrl.searchParams.get("format")==="csv"){
  const fields=betaFeedbackQuestions.flatMap(q=>q.extra?["q"+q.id,"q"+q.id+"_extra"]:["q"+q.id]);
  const header=["submitted_at","language",...fields].map(csvCell).join(",");
  const contents=[header,...rows.map(r=>[r.submitted_at,r.language,...fields.map(f=>(r.answers as Record<string,unknown>)?.[f])].map(csvCell).join(","))].join("\r\n");
  return new NextResponse(contents,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":"attachment; filename=intimo-beta-feedback.csv",...headers}});
 }
 const summary=betaFeedbackQuestions.filter(q=>q.kind==="scale"||q.kind==="choice").map(q=>{
  const vals=rows.map(r=>(r.answers as Record<string,unknown>)?.["q"+q.id]).filter(v=>v!==null&&v!==undefined&&v!=="");
  return {id:q.id,count:vals.length,average:q.kind==="scale"&&vals.length?Math.round((vals as number[]).reduce((a,b)=>a+b,0)/vals.length*10)/10:null,distribution:Object.fromEntries([...new Set(vals.map(String))].map(v=>[v,vals.filter(x=>String(x)===v).length]))};
 });
 return NextResponse.json({total:rows.length,responses:rows,summary,contacts:contacts.data??[],limit:500},{headers});
}
