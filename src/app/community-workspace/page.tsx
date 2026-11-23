"use client";
import React from "react";
import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { BehindTheDoorLanding } from "@/components/landing/BehindTheDoorLanding";
import { HeartHandshake, Link2, MessageSquareText, CalendarDays } from "lucide-react";

type Workspace = {
 allowed:true; invites:{issued:number;joined:number;unused:number;expiresAt:string};
 survey:{responses:number;resultsReady:boolean;safety:{mean:number;responses:number}|null;control:{mean:number;responses:number}|null;recommendation:{mean:number;responses:number}|null;tone:{choice:string;count:number}[]|null};
 schedule:{firstBatch:string;surveyOpens:string;betaEnds:string;launch:string};
};
export default function CollaboratorWorkspacePage(){
 const {t}=useTranslation();
 const {user,isAuthLoading}=useAuth();
 const [data,setData]=React.useState<Workspace|null>(null);
 const [error,setError]=React.useState("");
 const [loading,setLoading]=React.useState(true);
 React.useEffect(()=>{
  if(!user){setLoading(false);return;}
  let live=true;
  fetch("/api/collaborator/workspace",{credentials:"same-origin",cache:"no-store"}).then(async r=>{
   if(r.status===403)throw new Error("This workspace is not available for your account.");
   const body=await r.json().catch(()=>({}));
   if(!r.ok)throw new Error(body.error||"Workspace could not be loaded.");
   if(live)setData(body);
  }).catch(e=>{if(live)setError(String(e.message||e));}).finally(()=>{if(live)setLoading(false);});
  return()=>{live=false;};
 },[user]);
 if(isAuthLoading||loading)return <main className="mx-auto max-w-5xl p-8 text-sm text-velora-textMuted">{t("Loading…")}</main>;
 if(!user)return <BehindTheDoorLanding/>;
 if(error||!data)return <main className="mx-auto max-w-2xl p-8"><h1 className="font-display text-3xl text-ink">{t("Community workspace")}</h1><p role="alert" className="mt-3 text-sm text-velora-danger">{t(error||"Workspace unavailable")}</p><Link href="/me" className="mt-5 inline-block text-velora-accent">{t("Back to your account")}</Link></main>;
 const tile=(title:string,count:string,desc:string)=><article className="rounded-2xl border border-velora-line bg-velora-card p-5"><p className="text-xs font-semibold text-velora-textSecondary">{t(title)}</p><p className="mt-3 text-3xl font-semibold text-ink tabular-nums">{count}</p><p className="mt-1 text-xs leading-5 text-velora-textMuted">{t(desc)}</p></article>;
 return <main className="mx-auto max-w-6xl space-y-7 px-5 pb-24 pt-10 sm:px-8">
  <Link href="/me" className="text-sm text-velora-accent">{t("Back to your account")}</Link>
  <header className="rounded-3xl border border-velora-line bg-velora-card p-7 sm:p-9">
   <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-velora-accent"><HeartHandshake size={18}/>{t("Community & beta")}</div>
   <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">{t("Your Intimo workspace")}</h1>
   <p className="mt-3 max-w-2xl text-sm leading-6 text-velora-textSecondary">{t("Your place to follow the first invitations, review beta progress and help shape what comes next.")}</p>
  </header>
  <section aria-labelledby="invites" className="space-y-4"><h2 id="invites" className="flex items-center gap-2 font-display text-3xl text-ink"><Link2 size={23}/>{t("Invitations")}</h2>
   <div className="grid gap-3 sm:grid-cols-3">{tile("Personal beta links",String(data.invites.issued),"Active links issued to your beta group")}{tile("Joined",String(data.invites.joined),"Confirmed registrations through those links")}{tile("Awaiting registration",String(data.invites.unused),"Unused and unexpired links")}</div>
   <p className="text-xs text-velora-textMuted">{t("Existing beta links expire 31 December 2026. Revoked invitations and member identities are not shown.")}</p>
   <Link href="/me/invite" className="inline-flex min-h-11 items-center rounded-full border border-velora-line px-5 text-sm font-semibold text-ink">{t("Manage my invitations")}</Link>
  </section>
  <section aria-labelledby="feedback" className="space-y-4"><h2 id="feedback" className="flex items-center gap-2 font-display text-3xl text-ink"><MessageSquareText size={23}/>{t("Beta feedback")}</h2>
   <div className="grid gap-3 sm:grid-cols-3">{tile("Responses",String(data.survey.responses),"Anonymous submissions received")}{tile("Feeling safe",data.survey.safety?.mean.toFixed(1)??"—","Average score, out of 5")}{tile("Would invite a friend",data.survey.recommendation?.mean.toFixed(1)??"—","Average score, out of 10")}</div>
   {data.survey.resultsReady? <div className="rounded-2xl border border-velora-line bg-velora-surface p-5">
     <p className="font-semibold text-ink">{t("How explicit does Intimo feel?")}</p>
     <div className="mt-3 flex flex-wrap gap-3 text-sm text-velora-textSecondary">{(data.survey.tone||[]).map(item=><span className="rounded-full border border-velora-line px-3 py-2" key={item.choice}>{t(item.choice==="too_tame"?"Too tame":item.choice==="just_right"?"Just right":"Too much")}: {item.count}</span>)}</div>
    </div>
   :<p className="rounded-2xl border border-velora-line bg-velora-surface p-5 text-sm text-velora-textSecondary">{t("Survey insights will appear after at least five responses. Individual answers and contact details stay private.")}</p>}
   <p className="text-xs text-velora-textMuted">{t("This page shows aggregate feedback only, never individual answers or follow-up contact details.")}</p>
  </section>
  <section aria-labelledby="milestones" className="space-y-4"><h2 id="milestones" className="flex items-center gap-2 font-display text-3xl text-ink"><CalendarDays size={23}/>{t("Beta milestones")}</h2>
   <div className="grid gap-3 sm:grid-cols-2">{[
    ["7 December", "First invitation batch target"],
    ["15 December","Feedback questionnaire opens"],
    ["31 December","December beta finishes"],
    ["January 2027","Launch preparation"],
   ].map(([date,copy])=><div key={date} className="rounded-2xl border border-velora-line bg-velora-card p-5"><p className="text-sm font-semibold text-velora-accent">{t(date)}</p><p className="mt-2 text-sm text-ink">{t(copy)}</p></div>)}</div>
  </section>
 </main>;
}
