"use client";

import React from "react";
import Link from "next/link";
import { Compass, List, Map as MapIcon, CalendarDays } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { AREAS } from "@/lib/areas.mjs";
import { clock } from "@/lib/tonight.mjs";
import { discoveryPlanHref, parseTonightDiscovery, tonightDiscoveryHref } from "@/lib/tonightDiscovery.mjs";
import { replyHref, type Plan } from "@/components/plans/PlanCard";
import type { SceneEvent } from "@/components/scene/SceneEventCard";

/**
 * Phase 1 Prague discovery: deliberately an AREA overview, not a tracking map.
 * Only broad preselected districts; no user coordinates, device geolocation, or live presence.
 * Map indicators show ONLY organizer-published events, never individual member plans.
 * Member plans remain in the existing permission-filtered list. This prevents
 * differencing attacks through area and time filters on low-density groups.
 */
const PRAGUE = AREAS.filter((a) => a.kind === "PRAGUE_DISTRICT" && a.lat != null && a.lng != null);
const BOUNDS = { west: 14.29, east: 14.68, north: 50.15, south: 49.97 };
const point = (area: {lat: number|null;lng: number|null}) => ({
  x: 8 + (((area.lng ?? 14.48) - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * 84,
  y: 8 + ((BOUNDS.north - (area.lat ?? 50.08)) / (BOUNDS.north - BOUNDS.south)) * 84,
});
type Window = "all" | "now" | "tonight" | "upcoming";
const labelDate = (iso:string,lang:string) => new Intl.DateTimeFormat(lang==="cs"?"cs-CZ":"en-GB",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",timeZone:"Europe/Prague"}).format(new Date(iso));
export function planInWindow(starts:string, ends:string, window:Window, now:Date):boolean {
 const start=new Date(starts).getTime(),end=new Date(ends).getTime(),current=now.getTime();
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<=current)return false;
 if(window==="all")return true;
 if(window==="now")return start<=current;
 const pragueDay=(date:Date)=>new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Prague",year:"numeric",month:"2-digit",day:"2-digit"}).format(date);
 if(window==="tonight")return pragueDay(new Date(start))===pragueDay(now);
 return start>current;
}

export function PragueDiscovery({ plans, now }:{plans:Plan[];now:Date|null}) {
 const {t,language}=useTranslation();
 const [view,setView]=React.useState<"list"|"map">("list");
 const [window,setWindow]=React.useState<Window>("all");
 const [area,setArea]=React.useState("");
 const [filtersReady,setFiltersReady]=React.useState(false);
 React.useEffect(()=>{
   const context=parseTonightDiscovery(globalThis.window.location.search);
   setView(context.view);setWindow(context.when as Window);setArea(context.area);
   setFiltersReady(true);
 },[]);
 const context={view,when:window,area};
 React.useEffect(()=>{
   // Preserve only allowlisted filters; never store identity or geographic coordinates.
   if(!filtersReady)return;
   const next=tonightDiscoveryHref(context);
   const current=globalThis.window.location.pathname+globalThis.window.location.search;
   if(current!==next)globalThis.window.history.replaceState(globalThis.window.history.state,"",next);
 },[view,window,area,filtersReady]);
 const [events,setEvents]=React.useState<SceneEvent[]>([]);
 const [sceneError,setSceneError]=React.useState("");
 React.useEffect(()=>{
  let live=true;
  fetch("/api/scene?limit=60",{cache:"no-store",credentials:"same-origin"})
   .then(async r=>{const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error("Events unavailable");return data;})
   .then(data=>{if(live)setEvents(Array.isArray(data.events)?data.events:[]);})
   .catch(()=>{if(live)setSceneError("Events unavailable");});
  return()=>{live=false;};
 },[]);
 const filteredPlans=React.useMemo(()=>plans.filter(p=>(!area||p.areaId===area)&&(!now||planInWindow(p.startsAt,p.expiresAt,window,now))),[plans,area,window,now]);
 const filteredEvents=React.useMemo(()=>events.filter(e=>(!area||e.areaId===area)&&(!now||planInWindow(e.startsAt,e.endsAt||new Date(new Date(e.startsAt).getTime()+6*3600000).toISOString(),window,now))),[events,area,window,now]);
 const eventAreas=React.useMemo(()=>[...new Set(filteredEvents.filter(e=>e.areaId&&PRAGUE.some(a=>a.id===e.areaId)).map(e=>e.areaId as string))],[filteredEvents]);
 const known=filteredPlans.length+filteredEvents.length;
 return <section aria-labelledby="prague-discover-heading" className="mx-auto max-w-5xl border-y border-velora-line bg-velora-card px-5 py-8 sm:border sm:px-8">
   <div className="flex flex-wrap items-start justify-between gap-4">
     <div>
       <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-velora-accent"><Compass className="h-4 w-4"/>{t("Prague discovery")}</p>
       <h2 id="prague-discover-heading" className="mt-2 font-display text-3xl text-ink">{t("Find your kind of night")}</h2>
       <p className="mt-2 max-w-lg text-sm leading-6 text-velora-textSecondary">{t("Real member plans and approved scene events. Explore by Prague area, without live tracking.")}</p>
     </div>
     <div className="inline-flex rounded-full border border-velora-line p-1" role="group" aria-label={t("Discovery view")}>
       <button type="button" aria-pressed={view==="list"} onClick={()=>setView("list")} className={`flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold ${view==="list"?"bg-velora-accent text-velora-paper":"text-velora-ink2"}`}><List className="h-4 w-4"/>{t("List")}</button>
       <button type="button" aria-pressed={view==="map"} onClick={()=>setView("map")} className={`flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold ${view==="map"?"bg-velora-accent text-velora-paper":"text-velora-ink2"}`}><MapIcon className="h-4 w-4"/>{t("Areas")}</button>
     </div>
   </div>
   <div className="mt-6 flex flex-wrap gap-3">
     <label className="text-xs font-semibold text-velora-textSecondary">{t("When")}
       <select aria-label={t("When")} value={window} onChange={e=>setWindow(e.target.value as Window)} className="mt-1 block min-h-11 rounded-xl border border-velora-line bg-velora-surface px-3 text-sm text-ink">
         <option value="all">{t("All upcoming")}</option><option value="now">{t("Happening now")}</option><option value="tonight">{t("Tonight")}</option><option value="upcoming">{t("Starting later")}</option>
       </select>
     </label>
     <label className="text-xs font-semibold text-velora-textSecondary">{t("Prague area")}
       <select aria-label={t("Prague area")} value={area} onChange={e=>setArea(e.target.value)} className="mt-1 block min-h-11 max-w-[75vw] rounded-xl border border-velora-line bg-velora-surface px-3 text-sm text-ink">
         <option value="">{t("Every area")}</option>{PRAGUE.map(a=><option key={a.id} value={a.id}>{a.name} · {a.label}</option>)}
       </select>
     </label>
   </div>
   {view==="map" ? <div className="mt-6">
     <div className="relative overflow-hidden rounded-2xl border border-velora-line bg-velora-sunken" aria-label={t("Approximate Prague district overview, not exact locations")}>
       <div className="relative aspect-[4/3] min-h-[290px] max-h-[490px] w-full">
         <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full opacity-40">
           <path d="M8 36L25 12 49 11 63 20 82 9 94 36 87 57 96 75 73 94 51 87 30 98 11 77 4 53Z" fill="none" stroke="currentColor" strokeWidth=".6" strokeDasharray="2 2"/>
           <path d="M7 45Q30 59 48 42T93 61" fill="none" stroke="#A8D5EF" strokeWidth="2"/>
         </svg>
         {PRAGUE.map(a=>{
           const p=point(a),hasEvent=eventAreas.includes(a.id);
           if(!hasEvent)return null;
           return <button type="button" key={a.id} onClick={()=>{setArea(a.id);setView("list");}} title={a.name} aria-label={t("{area}: explore listings",{area:a.name})}
             className={`absolute flex min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-velora-paper text-[11px] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-velora-accent bg-velora-night text-velora-onPhoto`}
             style={{left:`${p.x}%`,top:`${p.y}%`}}><CalendarDays className="h-4 w-4" aria-hidden/></button>;
         })}
         {eventAreas.length===0&&<div className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-velora-textSecondary">{t("Nothing to map yet. Try another time or explore the list.")}</div>}
       </div>
     </div>
     <p className="mt-3 text-xs leading-5 text-velora-textMuted">{t("Area illustration, not a street map. Only approved public events are marked. Member plans are listed privately, not plotted or counted on the map.")}</p>
     <button type="button" onClick={()=>setView("list")} className="mt-3 min-h-11 text-sm font-semibold text-velora-accent underline">{t("See matching plans and events")}</button>
   </div> : <div className="mt-6 space-y-4">
     {known===0?<div className="border border-dashed border-velora-line p-6"><p className="text-sm text-velora-textSecondary">{t("Nothing published for these filters yet. You can make the first move.")}</p><Link href="/tonight/new" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-velora-accent underline">{t("Post a plan")}</Link></div>:null}
     {filteredPlans.map(p=><article key={p.id} className="border border-velora-line bg-velora-surface p-4">
       <p className="flex flex-wrap items-center gap-2 text-xs text-velora-textMuted"><span className="rounded-full border border-velora-accent/50 px-2 py-1">{t("Member plan")}</span>{p.areaName||t("Area not specified")} · {clock(p.startsAt)}</p>
       <h3 className="mt-2 font-display text-xl text-ink"><Link href={discoveryPlanHref(p.id,context)} className="hover:underline">{p.title}</Link></h3>
       <p className="mt-2 text-xs text-velora-textSecondary">{p.authorName} · {t(p.categoryLabel)}</p>
       {p.eligibilityText && <p className="mt-2 text-sm text-velora-ink2">{t(p.eligibilityText)}</p>}
       {p.canReply&&<Link href={replyHref(p)} className="mt-3 inline-flex min-h-11 items-center rounded-full bg-velora-warm px-4 text-sm font-semibold text-velora-paper">{t("Reply")}</Link>}
     </article>)}
     {filteredEvents.map(e=><article key={e.id} className="border border-velora-line bg-velora-surface p-4">
       <p className="flex flex-wrap items-center gap-2 text-xs text-velora-textMuted"><span className="rounded-full border border-velora-accent/50 px-2 py-1">{t("Published event")}</span>{e.areaName||t("Area not specified")} · {labelDate(e.startsAt,language)}</p>
       <h3 className="mt-2 font-display text-xl text-ink">{e.title}</h3>
       <p className="mt-1 text-sm text-velora-textSecondary">{e.organiser}</p>
       <div className="mt-3 flex flex-wrap items-center gap-4"><Link href={`/scene?event=${encodeURIComponent(e.id)}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-velora-accent underline">{t("View event")}</Link>{e.companyWindow && <Link href={`/tonight?event=${encodeURIComponent(e.id)}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-velora-accent underline">{t("Find company for this event")}</Link>}</div>
     </article>)}
     {sceneError&&<p role="status" className="text-xs text-velora-textMuted">{t("Scene events could not be loaded. Member plans remain available.")}</p>}
   </div>}
 </section>;
}
