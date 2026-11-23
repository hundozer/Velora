"use client";
import React from "react";
import {betaFeedbackQuestions} from "@/lib/betaFeedback";
type Row={id:string;submitted_at:string;language:"en"|"cs";answers:Record<string,string|number|null>};
type Summary={id:number;count:number;average:number|null;distribution:Record<string,number>};
type Contact={id:string;submitted_at:string;contact:string};
export function AdminBetaFeedbackConsole(){
 const [data,setData]=React.useState<{total:number;responses:Row[];contacts:Contact[];summary:Summary[];limit:number}|null>(null);
 const [error,setError]=React.useState("");
 const [loading,setLoading]=React.useState(true);
 React.useEffect(()=>{
  let alive=true;
  fetch("/api/admin/beta-feedback",{credentials:"same-origin",cache:"no-store"}).then(async r=>{
   const p=await r.json().catch(()=>({}));
   if(!r.ok)throw new Error(p.error||"Could not read feedback");
   if(alive)setData(p);
  }).catch(e=>{if(alive)setError(e.message);}).finally(()=>{if(alive)setLoading(false);});
  return ()=>{alive=false;};
 },[]);
 if(loading)return <p>Loading beta feedback…</p>;
 if(error)return <p role="alert" className="text-velora-danger">{error}</p>;
 if(!data)return null;
 return <div className="space-y-6">
  <div className="rounded-2xl border border-velora-line bg-velora-surface p-5">
   <h2 className="text-xl font-bold text-ink">December beta feedback</h2>
   <p className="mt-2 text-sm text-velora-textSecondary">{data.total} responses in the latest {data.limit}. Answers have no member IDs. Free text may still identify respondents; handle confidentially.</p>
   <a href="/api/admin/beta-feedback?format=csv" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-velora-warm px-5 py-3 text-sm font-semibold text-velora-paper">Export anonymous responses (CSV)</a>
  </div>
  <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Feedback metrics">
   {data.summary.map(s=><article key={s.id} className="rounded-xl border border-velora-line bg-velora-card p-4">
    <p className="text-sm font-semibold text-ink">{betaFeedbackQuestions.find(q=>q.id===s.id)?.en}</p>
    <p className="mt-3 text-2xl font-bold text-velora-accent">{s.average!==null?`${s.average} / ${s.id===12?10:5}`:s.count+" answers"}</p>
    <p className="mt-2 text-xs text-velora-textMuted">{s.count} responses · {Object.entries(s.distribution).map(([k,n])=>`${k}: ${n}`).join(" · ")}</p>
   </article>)}
  </section>
  <section className="space-y-3"><h2 className="text-lg font-semibold text-ink">Individual responses</h2>
   {data.responses.length===0?<p className="text-sm text-velora-textMuted">No responses yet.</p>:data.responses.map(row=><details key={row.id} className="rounded-xl border border-velora-line bg-velora-card p-4">
    <summary className="cursor-pointer text-sm font-semibold text-ink">{new Date(row.submitted_at).toLocaleDateString("en-GB")} · {row.language.toUpperCase()} · Anonymous response</summary>
    <dl className="mt-4 space-y-4">{betaFeedbackQuestions.map(q=><div key={q.id}><dt className="text-sm font-semibold text-velora-textSecondary">{q.id}. {q.en}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm text-ink">{String(row.answers["q"+q.id]??"No answer")}</dd>{q.extra&&row.answers["q"+q.id+"_extra"]&&<dd className="mt-1 whitespace-pre-wrap break-words text-xs text-velora-textSecondary">{String(row.answers["q"+q.id+"_extra"])}</dd>}</div>)}</dl>
   </details>)}
  </section>
  <section className="space-y-3 rounded-xl border border-velora-line bg-velora-surface p-5">
   <h2 className="text-lg font-semibold text-ink">Optional follow-up contacts</h2>
   <p className="text-xs text-velora-textSecondary">Stored independently from survey responses. No matching or attribution is possible from stored identifiers.</p>
   {data.contacts.length===0?<p className="text-sm text-velora-textMuted">No contact opt-ins.</p>:<ul className="space-y-2">{data.contacts.map(c=><li className="break-all text-sm text-ink" key={c.id}>{c.contact} · {new Date(c.submitted_at).toLocaleDateString("en-GB")}</li>)}</ul>}
  </section>
 </div>;
}
