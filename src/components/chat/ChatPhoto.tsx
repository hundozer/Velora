"use client";
import {useTranslation} from "@/context/LanguageContext";
import React from "react";
import {EyeOff} from "lucide-react";
/** Private chat photos: view-once bytes are requested only after explicit tap. */
export function ChatPhoto({src,mine,viewOnce=false,opened=false,messageId}:{
 src:string;mine:boolean;viewOnce?:boolean;opened?:boolean;messageId?:string
}){
 const {t}=useTranslation();
 const [revealed,setRevealed]=React.useState(mine);
 const [onceUrl,setOnceUrl]=React.useState<string|null>(null);
 const [busy,setBusy]=React.useState(false);
 const [failed,setFailed]=React.useState(false);
 React.useEffect(()=>()=>{if(onceUrl)URL.revokeObjectURL(onceUrl);},[onceUrl]);
 if(viewOnce && !mine){
  if(opened && !onceUrl)return <span className="block rounded-xl border border-velora-line px-4 py-3 text-sm">{t("Opened")}</span>;
  if(!onceUrl)return <button type="button" disabled={busy||failed||!messageId}
   className="rounded-xl border border-velora-line px-4 py-3 text-sm disabled:opacity-50"
   onClick={async()=>{
    setBusy(true);
    try{
      const response=await fetch("/api/messages/view-once",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({messageId})});
      if(!response.ok){setFailed(true);return;}
      const blob=await response.blob();setOnceUrl(URL.createObjectURL(blob));
    }catch{setFailed(true);}finally{setBusy(false);}
   }}>{t(failed?"Photo unavailable":busy?"Opening…":"Open once")}</button>;
  return <img src={onceUrl} alt={t("View-once photo")} className="max-h-72 w-full max-w-xs rounded-xl object-cover" draggable={false} onContextMenu={event=>event.preventDefault()}/>;
 }
 return <div className="relative">
  <button type="button" onClick={()=>setRevealed(true)} className="relative block overflow-hidden rounded-xl" aria-label={revealed?t("Photo"):t("Tap to view photo")}>
   {/* eslint-disable-next-line @next/next/no-img-element */}
   <img src={src} alt="" className={`max-h-72 w-full max-w-xs object-cover transition ${revealed?"":"scale-110 blur-2xl"}`} draggable={false} onContextMenu={event=>event.preventDefault()}/>
   {!revealed&&<span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 text-[11px] font-semibold text-white"><EyeOff className="h-4 w-4" aria-hidden/>{t("Tap to view")}</span>}
  </button>
  {viewOnce&&mine&&<span className="mt-1 block text-xs">{t(opened?"Opened":"View once")}</span>}
 </div>;
}
