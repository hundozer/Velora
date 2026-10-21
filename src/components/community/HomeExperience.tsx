"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

function LoadingHome() {
  return <div className="min-h-[70vh] px-5 py-12 text-velora-muted" role="status">Loading your home…</div>;
}

// Anonymous visitors do not need the member feed in their initial JavaScript.
const MemberActivityFeed = dynamic(
  () => import("@/components/community/MemberActivityFeed").then((module) => module.MemberActivityFeed),
  { loading: LoadingHome, ssr: false },
);

export function HomeExperience({ hasSessionHint, children }: { hasSessionHint: boolean; children: ReactNode }) {
  const { user, isAuthLoading } = useAuth();
  if (user) return <MemberActivityFeed />;
  // Cookie presence only prevents a marketing-page flash. AuthContext and the
  // feed API still verify the session; a forged/stale cookie grants no access.
  if (isAuthLoading && hasSessionHint) return <LoadingHome />;
  return children;
}
