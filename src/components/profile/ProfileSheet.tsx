"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ProfileStory } from "@/components/profile/ProfileStory";

/**
 * The profile as a sheet over People (approved v33). People stays mounted underneath, so
 * "Back to People" (or Escape, or the browser back button) returns to exactly the same place.
 */
export function ProfileSheet({ id }: { id: string }) {
  const router = useRouter();
  const panel = React.useRef<HTMLDivElement>(null);
  const close = React.useCallback(() => router.back(), [router]);

  React.useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", onKey); opener?.focus?.(); };
  }, [close]);

  React.useEffect(() => { panel.current?.scrollTo({ top: 0 }); }, [id]);

  return (
    <div className="fixed inset-0 z-40" role="presentation">
      <button type="button" aria-label="Back to People" tabIndex={-1} onClick={close} className="absolute inset-0 h-full w-full cursor-default bg-velora-night/80" />
      <p aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-velora-night px-5 pt-[max(0.5rem,env(safe-area-inset-top))] text-[13px] text-velora-paper/80 md:hidden">People · where you left off</p>
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Profile"
        className="absolute inset-x-0 bottom-16 top-8 overflow-y-auto overscroll-contain rounded-t-[28px] bg-velora-surface outline-none md:inset-y-6 md:bottom-6 md:left-1/2 md:right-auto md:w-[672px] md:-translate-x-1/2 md:rounded-[28px]"
      >
        <ProfileStory id={id} variant="sheet" onBack={close} />
      </div>
    </div>
  );
}
