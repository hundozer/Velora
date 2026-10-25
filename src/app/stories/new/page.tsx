"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
type Member={id:string;displayName:string};
export default function NewStory(){
 const router=useRouter();const [file,setFile]=React.useState<File|null>(null);const [preview,setPreview]=React.useState("");
 const [caption,setCaption]=React.useState("");const [audience,setAudience]=React.useState("FRIENDS");const [selected,setSelected]=React.useState<Member[]>([]);
 const [query,setQuery]=React.useState("");const [results,setResults]=React.useState<Member[]>([]);const [consent,setConsent]=React.useState(false);
 const [busy,setBusy]=React.useState(false);const [error,setError]=React.useState("");const [uploaded,setUploaded]=React.useState<string|null>(null);
 const [others,setOthers]=React.useState(false);
 React.useEffect(()=>{if(!file){setPreview("");return;}const url=URL.createObjectURL(file);setPreview(url);return()=>URL.revokeObjectURL(url);},[file]);
 React.useEffect(()=>{const c=new AbortController();if(audience!=="SELECTED"||query.trim().length<2){setResults([]);return;}
  const timer=setTimeout(()=>{void fetch(`/api/discovery/profiles?q=${encodeURIComponent(query.trim())}&sort=activity`,{signal:c.signal,cache:"no-store"}).then(async r=>{if(!r.ok)throw new Error();return r.json();}).then(d=>setResults(d.profiles||[])).catch(()=>{if(!c.signal.aborted)setError("People search unavailable");});},250);
  return()=>{clearTimeout(timer);c.abort();};
 },[query,audience]);
 async function json(url:string,body:unknown){const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(d.error||"Request failed");return d;}
 async function publish(e:React.FormEvent){
  e.preventDefault();if(!file||!consent||busy)return;setBusy(true);setError("");
  try{
   let id=uploaded;
   if(!id){
    const d=await json("/api/media/presign-upload",{fileName:file.name,fileType:file.type,fileSize:file.size,folder:"photos",category:"STORY",visibility:"PRIVATE",contentRating:"NON_EXPLICIT",participantDeclaration:{containsOtherIdentifiableParticipants:others,allParticipantsAdults:true,recordingConsented:true,publicationConsented:true}});
    id=d.mediaId;setUploaded(id);
    const put=await fetch(d.uploadUrl,{method:"PUT",headers:{"Content-Type":file.type},body:file});
    if(!put.ok)throw new Error("Photo upload failed. Discard it and try again.");
   }
   await json(`/api/media/${id}/complete`,{});
   await json("/api/stories",{mediaId:id,caption,audience,recipients:audience==="SELECTED"?selected.map(p=>p.id):[],confirmPublish:true});
   setUploaded(null);window.dispatchEvent(new Event("stories-changed"));router.push("/stories");
  }catch(e){setError((e instanceof Error?e.message:"Publication failed")+" Check Your stories before retrying if publication was interrupted.");}
  finally{setBusy(false);}
 }
 async function discard(){if(!uploaded)return;setBusy(true);try{const r=await fetch(`/api/media/${uploaded}`,{method:"DELETE"});if(!r.ok)throw new Error();setUploaded(null);setFile(null);setError("");}catch{setError("Photo cleanup failed. Please retry discard.");}finally{setBusy(false);}}
 return <main className="mx-auto max-w-lg px-5 py-8"><Link href="/stories" className="underline">Back to Stories</Link><h1 className="mt-6 font-display text-5xl">Your next 24 hours.</h1>
  <p className="mt-4 text-velora-ink2">A real photo. A little context. Only the people you choose. Photos are reviewed before others can see them.</p>
  <form onSubmit={publish} className="mt-8 space-y-6">
   <label className="block">Photo <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy||Boolean(uploaded)} onChange={e=>{const f=e.target.files?.[0]||null;if(f&&f.size>15*1024*1024){setError("Choose a photo under 15 MB.");return;}setFile(f);setConsent(false);}} className="mt-2 block w-full text-sm"/></label>
   {/* Local blob preview; never sent to an image optimiser. */}
   {/* eslint-disable-next-line @next/next/no-img-element */}
   {preview&&<img src={preview} alt="Your story preview" className="max-h-80 w-full rounded-2xl object-contain"/>}
   <label className="block">A few words <textarea value={caption} maxLength={240} onChange={e=>setCaption(e.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-velora-line bg-velora-surface p-3"/><span className="text-sm text-velora-muted">{caption.length}/240</span></label>
   <label className="block">Who can see this? <select value={audience} onChange={e=>{setAudience(e.target.value);setConsent(false);}} className="mt-2 min-h-12 w-full rounded-xl border border-velora-line bg-velora-surface p-3"><option value="FRIENDS">Friends only</option><option value="SELECTED">Selected people</option><option value="MEMBERS">Eligible signed-in adult members</option></select></label>
   <p className="text-sm text-velora-muted">Your profile visibility and blocks still apply. Replies follow your existing messaging boundaries. We show no ring to people outside your audience.</p>
   {audience==="SELECTED"&&<fieldset><legend>Choose up to 20 people</legend><label className="block">Search people <input value={query} onChange={e=>setQuery(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-velora-line bg-velora-surface p-3"/></label><div className="mt-3 flex flex-wrap gap-2">{selected.map(p=><button type="button" key={p.id} onClick={()=>setSelected(s=>s.filter(x=>x.id!==p.id))} className="min-h-11 rounded-full border border-velora-accent px-3">{p.displayName} ×</button>)}</div><ul>{results.filter(p=>!selected.some(s=>s.id===p.id)).map(p=><li key={p.id}><button type="button" disabled={selected.length>=20} onClick={()=>{setSelected(s=>[...s,p]);setQuery("");}} className="min-h-11 underline">Add {p.displayName}</button></li>)}</ul></fieldset>}
   <label className="flex items-start gap-3"><input type="checkbox" checked={others} disabled={Boolean(uploaded)} onChange={e=>{setOthers(e.target.checked);setConsent(false);}} className="mt-1"/><span>Other identifiable people appear in this photo.</span></label>
   <label className="flex items-start gap-3 rounded-xl border border-velora-line p-4"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} className="mt-1"/><span>This is a non-explicit photo. Everyone shown is an adult and agreed to both the photo and its publication to this audience. Publish for 24 hours.</span></label>
   <p className="text-sm text-velora-muted">Expiry stops viewing; storage cleanup follows our retention process. People can still save what they see.</p>
   {error&&<p role="alert">{error}</p>}
   {uploaded&&<button type="button" disabled={busy} onClick={discard} className="min-h-11 underline">Discard uploaded photo</button>}
   <button type="submit" disabled={busy||!file||!consent||(audience==="SELECTED"&&!selected.length)} className="min-h-12 w-full rounded-full bg-velora-accent px-6 font-semibold text-velora-paper disabled:opacity-40">{busy?"Publishing…":"Publish story"}</button>
  </form>
 </main>;
}
