"use client";
import React from "react";
import Link from "next/link";
import {useTranslation} from "@/context/LanguageContext";
import {useAuth} from "@/context/AuthContext";
import {BehindTheDoorLanding} from "@/components/landing/BehindTheDoorLanding";
import {betaFeedbackQuestions,BETA_FEEDBACK_OPEN_AT,BETA_FEEDBACK_CLOSE_AT} from "@/lib/betaFeedback";

export default function BetaFeedbackPage(){
 const {t,language}=useTranslation();
 const {user,isAuthLoading}=useAuth();
 const [answers,setAnswers]=React.useState<Record<string,string|number>>({});
 const [step,setStep]=React.useState(0);
 const [sending,setSending]=React.useState(false);
 const [complete,setComplete]=React.useState(false);
 const [error,setError]=React.useState("");
 const [contact,setContact]=React.useState("");
 const [consent,setConsent]=React.useState(false);
 const [contactSaved,setContactSaved]=React.useState(false);
 const open=Date.now()>=Date.parse(BETA_FEEDBACK_OPEN_AT)&&Date.now()<Date.parse(BETA_FEEDBACK_CLOSE_AT);
 const group=betaFeedbackQuestions.slice(step*5,step*5+5);
 const label=(en:string,cs:string)=>language==="cs"?cs:en;
 const field=(id:number,value:string|number)=>setAnswers(prev=>({...prev,["q"+id]:value}));
 const extra=(id:number,value:string)=>setAnswers(prev=>({...prev,["q"+id+"_extra"]:value}));
 async function submit(){
  setSending(true);setError("");
  try{
   const r=await fetch("/api/beta-feedback",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({language,answers})});
   const p=await r.json().catch(()=>({}));
   if(!r.ok)throw new Error(p.error||"Could not save feedback");
   setComplete(true);
  }catch(e){setError(e instanceof Error?e.message:"Could not save feedback");}
  finally{setSending(false);}
 }
 async function submitContact(e:React.FormEvent){
  e.preventDefault();setSending(true);setError("");
  try{
   const r=await fetch("/api/beta-feedback/contact",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({contact,consent})});
   const p=await r.json().catch(()=>({}));
   if(!r.ok)throw new Error(p.error||"Could not save contact");
   setContactSaved(true);setContact("");setConsent(false);
  }catch(e){setError(e instanceof Error?e.message:"Could not save contact");}
  finally{setSending(false);}
 }
 if(isAuthLoading)return <main className="mx-auto max-w-2xl p-8">{t("Loading…")}</main>;
 if(!user)return <BehindTheDoorLanding/>;
 return <main className="mx-auto max-w-2xl space-y-7 px-4 pb-24 pt-10 sm:px-6">
  <Link href="/dashboard" className="text-sm text-velora-accent">{t("Back to your Intimo home")}</Link>
  <header>
   <p className="text-xs font-semibold uppercase tracking-[.2em] text-velora-accent">{t("December beta")}</p>
   <h1 className="mt-3 font-display text-4xl text-ink">{t("Help shape Intimo")}</h1>
   <p className="mt-3 text-sm leading-6 text-velora-textSecondary">{label("A few minutes. Your answers aren't connected to your account. Please be honest: polite feedback doesn't help us.","Pár minut. Odpovědi nejsou spojené s tvým účtem. Upřímnost prosím: zdvořilá zpětná vazba nám nepomůže.")}</p>
   <p className="mt-2 text-xs text-velora-textMuted">{label("Please don't name other members or include identifying details. With a small beta group, free-text answers may still reveal who wrote them.","Neuváděj prosím jména členů ani identifikační údaje. V malé skupině může být autora volného textu přesto možné poznat.")}</p>
  </header>
  {!open?<section className="rounded-3xl border border-velora-line bg-velora-card p-7"><h2 className="text-xl font-semibold text-ink">{label("The feedback form opens 15 December.","Dotazník se otevře 15. prosince.")}</h2><p className="mt-2 text-sm text-velora-textSecondary">{label("Come back during the second half of the beta.","Vrať se během druhé poloviny beta testování.")}</p></section>
  :complete?<section className="space-y-5 rounded-3xl border border-velora-line bg-velora-card p-7">
   <h2 className="font-display text-3xl text-ink">{label("Thank you for saying it out loud.","Díky, že to říkáš nahlas.")}</h2>
   <p className="text-sm leading-6 text-velora-textSecondary">{label("Your answers are saved separately from your identity. Want a 15-minute follow-up conversation? This is entirely optional.","Odpovědi jsou uloženy odděleně od tvé identity. Chceš si s námi ještě na 15 minut promluvit? Je to zcela dobrovolné.")}</p>
   {contactSaved?<p role="status" className="text-sm text-velora-accent">{label("Thank you. We have your contact details.","Díky. Kontakt máme uložený.")}</p>
   :<form onSubmit={submitContact} className="space-y-3">
    <label className="block text-sm font-semibold text-ink">{label("How can we reach you? (email or preferred contact)","Jak tě můžeme kontaktovat? (e-mail nebo jiný kontakt)")}
     <input value={contact} onChange={e=>setContact(e.target.value)} maxLength={200} className="mt-2 block min-h-12 w-full rounded-xl border border-velora-line bg-velora-surface p-3 text-ink" />
    </label>
    <label className="flex gap-2 text-sm text-velora-textSecondary"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>{label("Yes, you may contact me for a 15-minute beta feedback conversation.","Ano, můžete mě kontaktovat kvůli 15minutovému rozhovoru o beta testování.")}</label>
    <button disabled={sending||!consent||contact.trim().length<3} className="rounded-full bg-velora-warm px-6 py-3 text-sm font-semibold text-velora-paper disabled:opacity-40">{label("Send my contact","Odeslat kontakt")}</button>
   </form>}
   {error&&<p role="alert" className="text-sm text-velora-danger">{error}</p>}
   <Link href="/dashboard" className="block text-sm text-velora-accent">{label("Return to Intimo","Zpět do Intima")}</Link>
  </section>
  :<section className="rounded-3xl border border-velora-line bg-velora-card p-5 sm:p-8">
   <div className="mb-7 flex items-center justify-between gap-3">
    <span className="text-xs font-bold uppercase tracking-wider text-velora-textMuted">{label("Part","Část")} {step+1} / 3</span>
    <span className="text-xs text-velora-textMuted">{step*5+1}–{Math.min(step*5+5,14)} / 14</span>
   </div>
   <div className="mb-8 h-1.5 overflow-hidden rounded-full bg-ink/10"><div className="h-full bg-velora-warm" style={{width:`${(step+1)/3*100}%`}}/></div>
   <div className="space-y-8">{group.map(q=><fieldset key={q.id} className="space-y-3">
    <legend className="text-base font-semibold leading-6 text-ink"><span className="mr-2 text-velora-accent">{q.id}.</span>{label(q.en,q.cs)}</legend>
    {q.kind==="text"?<textarea aria-label={label(q.en,q.cs)} rows={3} maxLength={1000} value={String(answers["q"+q.id]??"")} onChange={e=>field(q.id,e.target.value)}
      className="w-full rounded-xl border border-velora-line bg-velora-surface p-3 text-ink" />:
    q.kind==="scale"?<><div className="flex flex-wrap gap-2">{Array.from({length:q.id===12?11:5},(_,i)=>q.id===12?i:i+1).map(n=><label key={n} className="cursor-pointer"><input className="peer sr-only" type="radio" name={"q"+q.id} checked={answers["q"+q.id]===n} onChange={()=>field(q.id,n)}/><span className="flex h-10 min-w-10 items-center justify-center rounded-xl border border-velora-line px-2 text-sm text-ink peer-checked:border-velora-warm peer-checked:bg-velora-warm peer-checked:text-velora-paper">{n}</span></label>)}</div><p className="text-xs text-velora-textMuted">{label(q.helpEn||"",q.helpCs||"")}</p></>
    :<div className="flex flex-wrap gap-2">{q.choices?.map(c=><label key={c.value} className="cursor-pointer"><input className="peer sr-only" type="radio" name={"q"+q.id} checked={answers["q"+q.id]===c.value} onChange={()=>field(q.id,c.value)}/><span className="inline-block rounded-full border border-velora-line px-4 py-2 text-sm text-ink peer-checked:border-velora-warm peer-checked:bg-velora-warm peer-checked:text-velora-paper">{label(c.en,c.cs)}</span></label>)}</div>}
    {q.extra&&<textarea rows={2} maxLength={1000} value={String(answers["q"+q.id+"_extra"]??"")} onChange={e=>extra(q.id,e.target.value)} placeholder={label("Anything else? (optional)","Chceš něco dodat? (nepovinné)")} className="w-full rounded-xl border border-velora-line bg-velora-surface p-3 text-sm text-ink"/>}
   </fieldset>)}</div>
   {error&&<p role="alert" className="mt-5 text-sm text-velora-danger">{error}</p>}
   <div className="mt-8 flex justify-between gap-3 border-t border-velora-line pt-5">
    <button type="button" disabled={step===0||sending} onClick={()=>setStep(s=>Math.max(0,s-1))} className="rounded-full border border-velora-line px-5 py-3 text-sm font-semibold text-ink disabled:opacity-40">{label("Back","Zpět")}</button>
    {step<2?<button type="button" onClick={()=>setStep(s=>s+1)} className="rounded-full bg-velora-warm px-6 py-3 text-sm font-semibold text-velora-paper">{label("Continue","Pokračovat")}</button>
    :<button type="button" disabled={sending||!Object.values(answers).some(x=>String(x).trim()!=="")} onClick={()=>void submit()} className="rounded-full bg-velora-warm px-6 py-3 text-sm font-semibold text-velora-paper disabled:opacity-40">{sending?label("Sending…","Odesílání…"):label("Send feedback","Odeslat zpětnou vazbu")}</button>}
   </div>
  </section>}
 </main>;
}
