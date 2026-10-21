"use client";

import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { CompletionState, PrimaryAction, SecondaryAction } from "@/components/editorial/Editorial";

// One line per member-only area: what's behind the door, not why it's locked.
const COPY: Record<string, string> = {
  "/tonight": "See who's out tonight.",
  "/messages": "Your conversations live here.",
  "/activity": "See who's interested in you.",
  "/favorites": "Your saved people and plans.",
};

/** Shared sign-in boundary for member-only screens. */
export function BehindTheDoorLanding() {
  const pathname = usePathname() || "";
  const title = Object.entries(COPY).find(([prefix]) => pathname.startsWith(prefix))?.[1] || "Members only.";
  const returnTo = encodeURIComponent(pathname || "/");
  return (
    <main className="flex min-h-[70vh] items-center">
      <CompletionState
        icon={<Lock className="h-7 w-7" aria-hidden />}
        title={title}
        body="Members only. Sign in or create an account to take a look."
        action={<div className="flex flex-col justify-center gap-3 sm:flex-row"><PrimaryAction href="/auth/login?screen_hint=signup">Join Intimo</PrimaryAction><SecondaryAction href={`/auth/login?returnTo=${returnTo}`}>Sign in</SecondaryAction></div>}
      />
    </main>
  );
}
