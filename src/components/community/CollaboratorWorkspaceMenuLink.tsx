"use client";
import React from "react";
import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "@/context/LanguageContext";

// Menu visibility is a convenience only. The API and page independently
// authorize the current session using a server-side database grant.
export function CollaboratorWorkspaceMenuLink({mobile=false}:{mobile?:boolean}) {
 const {user}=useAuth();
 const {t}=useTranslation();
 const [allowed,setAllowed]=React.useState(false);
 React.useEffect(()=>{
  if(!user){setAllowed(false);return;}
  let active=true;
  fetch("/api/collaborator/workspace",{credentials:"same-origin",cache:"no-store"})
   .then(response=>{if(active)setAllowed(response.ok);})
   .catch(()=>{if(active)setAllowed(false);});
  return()=>{active=false;};
 },[user]);
 if(!allowed)return null;
 return <Link href="/community-workspace" className={mobile
  ?"flex min-h-14 items-center gap-4 px-5 py-4 text-velora-ink hover:bg-velora-sunken/80"
  :"flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-velora-textPrimary hover:bg-ink/5"}>
  <HeartHandshake className="h-[18px] w-[18px] shrink-0 text-velora-accent" aria-hidden />
  <span className={mobile?"flex-1 text-sm font-semibold":""}>{t("Community workspace")}</span>
 </Link>;
}
