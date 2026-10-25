"use client";
import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { StoryAvatar } from "@/components/stories/StoryAvatar";
type Story={id:string;ownerId:string;caption:string;owner?:{display_name:string;avatar_url:string};audience:string;expires_at?:string;media_objects?:{moderation_status:string}};
export default function StoriesPage(){
 const {profile}=useAuth();const [stories,setStories]=React.useState<Story[]>([]);const [mine,setMine]=React.useState<Story[]>([]);const [error,setError]=React.useState("");const [loading,setLoading]=React.useState(true);
 const load=React.useCallback(async()=>{try{
  const responses=await Promise.all([fetch("/api/stories",{cache:"no-store"}),fetch("/api/stories?mine=true",{cache:"no-store"})]);
  const data=await Promise.all(responses.map(r=>r.json()));
  if(responses.some(r=>!r.ok))throw new Error("Stories could not be loaded.");
  setStories(data[0].stories||[]);setMine(data[1].stories||[]);setError("");
 }catch{setError("Stories could not be loaded. Try again.");}finally{setLoading(false);}},[]);
 React.useEffect(()=>{void load();const timer=setInterval(load,30000);return()=>clearInterval(timer);},[load]);
 const owners=stories.filter((s,i,a)=>a.findIndex(x=>x.ownerId===s.ownerId)===i);
 async function remove(id:string){if(!window.confirm("Delete this story now?"))return;try{
  const r=await fetch(`/api/stories/${id}`,{method:"DELETE"});const d=await r.json();if(!r.ok)throw new Error(d.error);window.dispatchEvent(new Event("stories-changed"));await load();
 }catch(e){setError(e instanceof Error?e.message:"Deletion failed");await load();}}
 return <main className="mx-auto max-w-2xl px-5 py-8">
  <header className="flex flex-wrap items-center justify-between gap-4"><h1 className="font-display text-5xl">Stories</h1><Link href="/stories/new" className="rounded-full bg-velora-accent px-5 py-3 font-semibold text-velora-paper">Add a story</Link></header>
  <p className="mt-4 text-velora-ink2">A glimpse of your day. Photo stories disappear from view after 24 hours. Your audience, your choice.</p>
  {error&&<p role="alert" className="mt-5">{error} <button type="button" onClick={load} className="underline">Retry</button></p>}
  {loading?<p role="status" className="mt-8">Loading…</p>:<>
   <section aria-label="Member stories" className="mt-8 flex flex-wrap gap-5">{owners.map(s=><div key={s.ownerId} className="w-20 text-center"><StoryAvatar ownerId={s.ownerId} name={s.owner?.display_name||"Member"} src={s.owner?.avatar_url} size={72}/><Link href={`/profile/${s.ownerId}`} className="mt-2 block truncate text-sm">{s.owner?.display_name||"Member"}</Link></div>)}</section>
   {!owners.length&&!error&&<p className="mt-8 text-velora-muted">No stories available to you yet.</p>}
   <section aria-label="My stories" className="mt-10"><h2 className="font-display text-3xl">Your stories</h2><p className="mt-2 text-sm text-velora-muted">Photos are reviewed before others can see them. The 24-hour window starts when you publish.</p>
    {mine.map(s=><div key={s.id} className="mt-4 flex items-center justify-between gap-4 border-b border-velora-line pb-4"><div><p className="break-words">{s.caption||"Photo story"}</p><p className="text-sm text-velora-muted">{s.audience} · {s.media_objects?.moderation_status?.replaceAll("_"," ")||"Review pending"}</p></div><div className="flex gap-3"><Link href={`/stories/${profile?.id}`} className="min-h-11 py-3 underline">View</Link><button type="button" onClick={()=>remove(s.id)} className="min-h-11 underline">Delete</button></div></div>)}
    {!mine.length&&<p className="mt-4 text-velora-muted">You have no active stories.</p>}
   </section>
  </>}
 </main>;
}
