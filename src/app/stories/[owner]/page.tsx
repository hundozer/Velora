"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReportModal } from "@/components/safety/ReportModal";
type Story={id:string;ownerId:string;mediaId:string;caption:string;expiresAt:string;audience:string;url:string;owner?:{display_name:string};viewed:boolean};
export default function StoryViewer({params}:{params:{owner:string}}){
 const router=useRouter();const [stories,setStories]=React.useState<Story[]>([]);const [index,setIndex]=React.useState(0);
 const [error,setError]=React.useState("");const [loaded,setLoaded]=React.useState(false);const [report,setReport]=React.useState(false);
 const [visible,setVisible]=React.useState(true);const [loading,setLoading]=React.useState(true);
 React.useEffect(()=>{
  let active=true;const controller=new AbortController();
  async function refresh(){try{
   const r=await fetch(`/api/stories?owners=${encodeURIComponent(params.owner)}`,{cache:"no-store",signal:controller.signal});
   const d=await r.json();if(!active)return;
   if(!r.ok)throw new Error(d.error||"Stories unavailable");
   setStories((d.stories||[]).reverse());setError("");
  }catch(e){if(active){setStories([]);setError(e instanceof Error?e.message:"Stories unavailable");}}
  finally{if(active)setLoading(false);}}
  void refresh();const timer=setInterval(refresh,15000);
  const visibility=()=>{setVisible(!document.hidden);if(!document.hidden)void refresh();};
  const key=(e:KeyboardEvent)=>{if(e.key==="Escape")router.back();if(e.key==="ArrowRight")setIndex(i=>i+1);if(e.key==="ArrowLeft")setIndex(i=>Math.max(0,i-1));};
  document.addEventListener("visibilitychange",visibility);document.addEventListener("keydown",key);
  return()=>{active=false;controller.abort();clearInterval(timer);document.removeEventListener("visibilitychange",visibility);document.removeEventListener("keydown",key);};
 },[params.owner,router]);
 const story=stories[Math.min(index,Math.max(0,stories.length-1))];
 const storyId=story?.id;const expiresAt=story?.expiresAt;
 React.useEffect(()=>{setLoaded(false);setReport(false);if(!storyId||!expiresAt)return;const timer=setTimeout(()=>setStories(s=>s.filter(x=>x.id!==storyId)),Math.max(0,Date.parse(expiresAt)-Date.now()));return()=>clearTimeout(timer);},[storyId,expiresAt]);
 function viewed(){
  setLoaded(true);
  if(story)void fetch(`/api/stories/${story.id}`,{method:"POST"}).then(r=>{if(r.ok)window.dispatchEvent(new Event("stories-changed"));});
 }
 return <main className="mx-auto min-h-[85svh] max-w-lg bg-velora-night px-5 py-5 text-velora-onPhoto">
  <header className="flex min-h-12 items-center justify-between">
   <Link href={`/profile/${params.owner}`} className="font-semibold underline">{story?.owner?.display_name||"Stories"}</Link>
   <button type="button" onClick={()=>router.back()} className="min-h-11 px-3" aria-label="Close stories">Close ✕</button>
  </header>
  {loading?<p role="status">Loading stories…</p>:!story?<p role="status" className="py-20">{error||"No stories available to you right now."}</p>:<>
   <p aria-live="polite" className="mb-3 text-sm">{Math.min(index+1,stories.length)} of {stories.length} · {story.audience==="MEMBERS"?"Members":story.audience==="FRIENDS"?"Friends":"Selected people"}</p>
   <div className="flex min-h-[45svh] items-center justify-center rounded-2xl bg-black">
    {/* Authenticated no-store image; an optimiser must never cache these bytes. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {visible&&<img key={story.id} src={story.url} alt={story.caption||"Member story photo"} className="max-h-[65svh] w-full rounded-2xl object-contain" onLoad={viewed} onError={()=>{setLoaded(false);setError("This photo is no longer available.");}}/>}
   </div>
   {error&&<p role="alert" className="mt-3">{error}</p>}
   <p className="mt-4 whitespace-pre-wrap break-words text-lg">{story.caption}</p>
   <nav aria-label="Story navigation" className="mt-4 flex justify-between">
    <button type="button" disabled={index===0} onClick={()=>setIndex(i=>i-1)} className="min-h-12 px-4 disabled:opacity-40">Previous</button>
    <button type="button" disabled={index>=stories.length-1} onClick={()=>setIndex(i=>i+1)} className="min-h-12 px-4 disabled:opacity-40">Next</button>
   </nav>
   <div className="mt-3 flex items-center justify-between">
    <Link href={`/messages?user=${story.ownerId}`} className="min-h-11 py-3 underline">Reply privately</Link>
    <button type="button" disabled={!loaded} onClick={()=>setReport(true)} className="min-h-11 px-3 underline disabled:opacity-40">Report photo</button>
   </div>
   {report&&<ReportModal isOpen={report} onClose={()=>setReport(false)} contentType="PHOTO" contentId={story.mediaId} targetProfileId={story.ownerId} targetUsername={story.owner?.display_name||"this member"}/>}
  </>}
 </main>;
}
