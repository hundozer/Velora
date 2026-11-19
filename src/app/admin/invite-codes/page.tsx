"use client";
import React, {useEffect,useState} from "react";

type CodeRow={id:string;source_label:string;owner_name:string;max_uses:number;uses:number;expires_at:string;revoked_at:string|null;created_at:string};
type Created={id:string;url:string};
export default function InviteCodesAdminPage(){
 const [codes,setCodes]=useState<CodeRow[]>([]);
 const [links,setLinks]=useState<Created[]>([]);
 const [sourceLabel,setSource]=useState("Carolinka test group");
 const [ownerName,setOwner]=useState("Carolinka");
 const [ownerProfileId,setOwnerProfileId]=useState("");
 const [quantity,setQuantity]=useState(10);
 const [maxUses,setUses]=useState(1);
 const [expiresAt,setExpires]=useState(()=>new Date(Date.now()+21*86400000).toISOString().slice(0,10));
 const [working,setWorking]=useState(false);
 const [message,setMessage]=useState("");
 const load=async()=>{const res=await fetch("/api/admin/invite-codes",{cache:"no-store"});const json=await res.json();if(res.ok)setCodes(json.codes ?? []);else setMessage(json.error ?? "Unable to load codes");};
 useEffect(()=>{void load();},[]);
 const create=async(e:React.FormEvent)=>{
  e.preventDefault();setWorking(true);setMessage("");setLinks([]);
  const res=await fetch("/api/admin/invite-codes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sourceLabel,ownerName,ownerProfileId,quantity,maxUses,expiresAt:new Date(expiresAt+"T23:59:59Z").toISOString()})});
  const json=await res.json().catch(()=>({}));
  if(res.ok){setLinks(json.links ?? []);setMessage("Codes created. Copy these links now: they will never be shown again.");await load();}
  else setMessage(json.error ?? "Creation failed");
  setWorking(false);
 };
 const revoke=async(id:string)=>{
  if(!window.confirm("Revoke this code immediately?"))return;
  setWorking(true);
  const res=await fetch("/api/admin/invite-codes",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,action:"revoke"})});
  const json=await res.json().catch(()=>({}));
  setMessage(res.ok?"Code revoked":json.error ?? "Could not revoke");
  await load();setWorking(false);
 };
 return <main className="mx-auto max-w-5xl px-6 py-12 text-velora-ink">
  <h1 className="font-display text-5xl">Invitation codes</h1>
  <p className="mt-3 text-velora-textSecondary">Generate personal test links or a capped shared code. Every new member still needs approval and age verification.</p>
  <form onSubmit={create} className="mt-8 grid gap-4 rounded-3xl border border-velora-line bg-velora-surface p-6 sm:grid-cols-2">
   <label className="grid gap-1">Source label<input className="rounded-lg border p-3 text-velora-ink" value={sourceLabel} required maxLength={120} onChange={e=>setSource(e.target.value)}/></label>
   <label className="grid gap-1">Named owner<input className="rounded-lg border p-3 text-velora-ink" value={ownerName} required maxLength={120} onChange={e=>setOwner(e.target.value)}/></label>
   <label className="grid gap-1">Owner member ID (optional; enables their aggregate tracking)<input className="rounded-lg border p-3 text-velora-ink" value={ownerProfileId} onChange={e=>setOwnerProfileId(e.target.value)} placeholder="UUID"/></label>
   <label className="grid gap-1">Number of unique links<input className="rounded-lg border p-3 text-velora-ink" type="number" min={1} max={50} value={quantity} onChange={e=>setQuantity(Number(e.target.value))}/></label>
   <label className="grid gap-1">Uses per link<input className="rounded-lg border p-3 text-velora-ink" type="number" min={1} max={1000} value={maxUses} onChange={e=>setUses(Number(e.target.value))}/></label>
   <label className="grid gap-1">Expiry date (UTC)<input className="rounded-lg border p-3 text-velora-ink" type="date" required value={expiresAt} onChange={e=>setExpires(e.target.value)}/></label>
   <button disabled={working} className="self-end rounded-xl bg-velora-accent px-6 py-3 font-semibold text-velora-paper disabled:opacity-40">Create codes</button>
  </form>
  {message&&<p role="status" className="mt-5">{message}</p>}
  {links.length>0&&<section className="mt-6 rounded-3xl border border-velora-line p-6">
   <h2 className="text-xl font-semibold">New links — copy once</h2>
   <button className="mt-4 rounded-xl border border-velora-line px-4 py-2" onClick={()=>void navigator.clipboard.writeText(links.map(x=>x.url).join("\n"))}>Copy all links</button>
   <ol className="mt-4 space-y-2">{links.map(x=><li key={x.id} className="break-all text-sm"><a className="underline" href={x.url} target="_blank" rel="noreferrer">{x.url}</a></li>)}</ol>
  </section>}
  <h2 className="mt-12 text-2xl font-semibold">Issued codes</h2>
  <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-velora-line"><th className="p-3">Source</th><th className="p-3">Owner</th><th className="p-3">Uses</th><th className="p-3">Expires</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead><tbody>
   {codes.map(c=><tr key={c.id} className="border-b border-velora-line"><td className="p-3">{c.source_label}</td><td className="p-3">{c.owner_name}</td><td className="p-3">{c.uses}/{c.max_uses}</td><td className="p-3">{new Date(c.expires_at).toLocaleDateString()}</td><td className="p-3">{c.revoked_at?"Revoked":new Date(c.expires_at).getTime()<Date.now()?"Expired":c.uses>=c.max_uses?"Used up":"Active"}</td><td className="p-3">{!c.revoked_at&&<button disabled={working} className="underline" onClick={()=>void revoke(c.id)}>Revoke</button>}</td></tr>)}
  </tbody></table></div>
 </main>;
}
