"use client";

import React from "react";
import { Heart } from "lucide-react";

/** Like toggle for an approved photo (P1-12). Shows a count only when above zero. */
export function LikeButton({ mediaId, className = "" }: { mediaId: string; className?: string }) {
  const [state, setState] = React.useState<{ count: number; liked: boolean } | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    fetch(`/api/reactions?mediaId=${encodeURIComponent(mediaId)}`, { credentials: "same-origin", cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => { if (!cancelled && payload) setState(payload); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [mediaId]);

  async function toggle(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (busy) return;
    setBusy(true);
    const response = await fetch("/api/reactions", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mediaId }) });
    if (response.ok) setState(await response.json());
    setBusy(false);
  }

  if (!state) return null;
  return (
    <button type="button" onClick={toggle} aria-pressed={state.liked} aria-label={state.liked ? "Unlike photo" : "Like photo"} className={`inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur ${className}`}>
      <Heart className={`h-3.5 w-3.5 ${state.liked ? "fill-rose-400 text-velora-danger" : ""}`} aria-hidden />
      {state.count > 0 && <span>{state.count}</span>}
    </button>
  );
}
