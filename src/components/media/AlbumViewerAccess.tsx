"use client";
import React from "react";
import { useTranslation } from "@/context/LanguageContext";

type Viewer = {id:string;name:string;expiresAt:string|null};
export function AlbumViewerAccess({albumId}:{albumId:string}){
  const {t}=useTranslation();
  const [viewers,setViewers]=React.useState<Viewer[]>([]);
  const [username,setUsername]=React.useState("");
  const [busy,setBusy]=React.useState(false);
  const [error,setError]=React.useState("");
  const [notice,setNotice]=React.useState("");
  const endpoint=`/api/albums/${encodeURIComponent(albumId)}/access`;
  const refresh=React.useCallback(async(signal?:AbortSignal)=>{
    const r=await fetch(endpoint,{cache:"no-store",credentials:"same-origin",signal});
    const body=await r.json().catch(()=>({}));
    if(!r.ok)throw Error(body.error||"Could not load approved people");
    setViewers(body.viewers||[]);
  },[endpoint]);
  React.useEffect(()=>{
    const ctrl=new AbortController();
    setViewers([]);setError("");setNotice("");setUsername("");
    void refresh(ctrl.signal).catch(err=>{if(!ctrl.signal.aborted)setError(String(err.message))});
    return ()=>ctrl.abort();
  },[refresh]);
  async function action(method:"POST"|"DELETE",payload:unknown){
    if(busy)return;
    setBusy(true);setError("");setNotice("");
    try{
      const r=await fetch(endpoint,{method,credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const body=await r.json().catch(()=>({}));
      if(!r.ok)throw Error(body.error||"Could not update access");
      await refresh();setUsername("");
      setNotice(method==="POST"?"Member approved for this album.":"Album access revoked.");
    }catch(err){setError(err instanceof Error?err.message:"Could not update access")}
    finally{setBusy(false)}
  }
  return <section aria-label={t("Approved people")} className="rounded-2xl border border-ink/10 bg-velora-surface p-5">
    <h3 className="text-xl font-semibold text-ink">{t("Approved people")}</h3>
    <p className="mt-2 text-sm text-velora-textSecondary">{t("Only people you approve for this album can see its photos. Access to other albums is never included.")}</p>
    <form onSubmit={e=>{e.preventDefault();void action("POST",{username:username.trim()})}} className="mt-4 flex flex-wrap gap-2">
      <input aria-label={t("Exact username")} value={username} maxLength={60} onChange={e=>setUsername(e.target.value)}
        placeholder={t("Exact username")} className="min-h-11 min-w-0 flex-1 rounded-xl border border-ink/15 bg-velora-surface px-3 text-ink" />
      <button disabled={busy||username.trim().length<2} type="submit" className="min-h-11 rounded-full bg-velora-warm px-4 font-semibold text-velora-paper disabled:opacity-50">{t("Approve person")}</button>
    </form>
    {viewers.length===0?<p className="mt-4 text-sm text-velora-textSecondary">{t("Nobody has access yet.")}</p>:
      <ul className="mt-4 divide-y divide-ink/10">{viewers.map(viewer=><li key={viewer.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
        <span className="break-all text-sm font-semibold text-ink">{viewer.name}</span>
        <button disabled={busy} type="button" className="min-h-11 rounded-xl border border-red-400/50 px-4 text-sm font-semibold text-velora-danger disabled:opacity-50"
          onClick={()=>void action("DELETE",{viewerId:viewer.id})}>{t("Remove access")}</button>
      </li>)}</ul>}
    {error&&<p role="alert" className="mt-3 text-sm text-velora-danger">{t(error)}</p>}
    {notice&&<p role="status" className="mt-3 text-sm text-velora-textSecondary">{t(notice)}</p>}
  </section>;
}
