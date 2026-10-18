"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { MemberPeople } from "@/components/people/MemberPeople";
import { PublicPeopleBrowse } from "@/components/people/PublicPeopleBrowse";

/** People: members get filtered discovery; signed-out visitors see opted-in public profiles only. */
export default function PeoplePage() {
  const { user, isAuthLoading } = useAuth();
  if (isAuthLoading) return <main className="mx-auto max-w-5xl px-4 py-10 text-sm text-velora-textMuted">Loading…</main>;
  // MemberPeople reads its filters from the URL (useSearchParams needs a Suspense boundary).
  return user ? <React.Suspense fallback={null}><MemberPeople /></React.Suspense> : <PublicPeopleBrowse />;
}
