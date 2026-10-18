"use client";

import React from "react";
import { EyeOff } from "lucide-react";

/** A photo in a conversation (P1-10). Received photos stay blurred until tapped. */
export function ChatPhoto({ src, mine }: { src: string; mine: boolean }) {
  const [revealed, setRevealed] = React.useState(mine);
  return (
    <button type="button" onClick={() => setRevealed(true)} className="relative block overflow-hidden rounded-xl" aria-label={revealed ? "Photo" : "Tap to view photo"}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className={`max-h-72 w-full max-w-xs object-cover transition ${revealed ? "" : "scale-110 blur-2xl"}`} draggable={false} onContextMenu={(event) => event.preventDefault()} />
      {!revealed && <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 text-[11px] font-semibold text-white"><EyeOff className="h-4 w-4" aria-hidden />Tap to view</span>}
    </button>
  );
}
