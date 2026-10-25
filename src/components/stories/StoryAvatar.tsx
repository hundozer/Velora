"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Portrait } from "@/components/media/Portrait";
type Summary={unread:boolean;expiresAt:string};
// Batch visible avatars into one request. Keys include the signed-in identity;
// summaries are never persisted or shared between accounts.
const pending=new Map<string,{owners:Map<string,Array<(value:Summary|null)=>void>>;timer:ReturnType<typeof setTimeout>}>();
function requestSummary(session:string,owner:string):Promise<Summary|null>{
 return new Promise(resolve=>{
  let batch=pending.get(session);
  if(!batch){
   const owners=new Map<string,Array<(value:Summary|null)=>void>>();
   const timer=setTimeout(async()=>{
    pending.delete(session);const entries=[...owners.entries()];
    for(let start=0;start<entries.length;start+=50){
     const chunk=entries.slice(start,start+50);
     try{
      const r=await fetch(`/api/stories?summary=true&owners=${chunk.map(([id])=>id).join(",")}`,{cache:"no-store"});
      const d=r.ok?await r.json():{};
      chunk.forEach(([id,callbacks])=>callbacks.forEach(fn=>fn(d.summary?.[id]??null)));
     }catch{chunk.forEach(([,callbacks])=>callbacks.forEach(fn=>fn(null)));}
    }
   },0);
   batch={owners,timer};pending.set(session,batch);
  }
  const callbacks=batch.owners.get(owner)||[];callbacks.push(resolve);batch.owners.set(owner,callbacks);
 });
}
export function useStorySummary(ownerId:string){
 const {user}=useAuth();const session=user?.id;
 const [summary,setSummary]=React.useState<Summary|null>(null);
 React.useEffect(()=>{
  let alive=true;setSummary(null);
  const refresh=()=>{if(session&&ownerId)void requestSummary(session,ownerId).then(s=>{if(alive)setSummary(s);});};
  refresh();const timer=setInterval(refresh,30000);
  window.addEventListener("focus",refresh);window.addEventListener("stories-changed",refresh);
  return()=>{alive=false;clearInterval(timer);window.removeEventListener("focus",refresh);window.removeEventListener("stories-changed",refresh);};
 },[session,ownerId]);
 React.useEffect(()=>{if(!summary)return;const timer=setTimeout(()=>setSummary(null),Math.max(0,Date.parse(summary.expiresAt)-Date.now()));return()=>clearTimeout(timer);},[summary]);
 return summary&&Date.parse(summary.expiresAt)>Date.now()?summary:null;
}
export function StoryAvatar({ownerId,name,src,size=52,fallbackHref}:{ownerId:string;name:string;src?:string|null;size?:number;fallbackHref?:string}){
 const summary=useStorySummary(ownerId);const router=useRouter();
 return <button type="button" onClick={()=>router.push(summary?`/stories/${ownerId}`:(fallbackHref||`/profile/${ownerId}`))}
  aria-label={summary?`${name}: ${summary.unread?"new":"viewed"} stories`:`Open ${name}'s profile`}
  className={`shrink-0 rounded-full p-[3px] outline-offset-4 ${summary?(summary.unread?"bg-velora-accent shadow-[0_0_12px_rgb(var(--accent)/0.35)]":"bg-velora-muted"):"bg-transparent"}`}
  style={{width:size,height:size}} data-story-state={summary?(summary.unread?"unread":"viewed"):"none"}>
  <Portrait src={src} name={name} sizes={`${size}px`} className="h-full w-full rounded-full border-2 border-velora-surface" monogramClassName="text-xl"/>
 </button>;
}
