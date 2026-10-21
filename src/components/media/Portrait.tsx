"use client";

import React, { useState } from "react";

const TONES = [
  { bg: "rgb(var(--surface))", fg: "rgb(var(--accent))" },
  { bg: "rgb(var(--sunken))", fg: "rgb(var(--success))" },
  { bg: "rgb(var(--blush))", fg: "rgb(var(--accent-hover))" },
  { bg: "rgb(var(--paper))", fg: "rgb(var(--ink-2))" },
];

/** Initials for the photo-free portrait: "Tomáš & Nina" -> "T&N", "Lena" -> "L". */
export function monogram(name: string) {
  const parts = name.split("&").map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1) return parts.map((p) => p[0]?.toUpperCase() ?? "").join("&");
  return (name.trim()[0] ?? "?").toUpperCase();
}

function toneFor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
}

/** Adds ?w= variants to our own media URLs; external URLs are used as they are. */
export function mediaSrcSet(src: string) {
  if (!src.startsWith("/api/media/")) return undefined;
  const base = src.split("?")[0];
  return [160, 640, 1080].map((w) => `${base}?w=${w} ${w}w`).join(", ");
}

/**
 * A member's photograph, or a typographic portrait when there is none or it fails.
 * The dominant colour shows while the image loads, so layouts never wait on photos.
 */
export function Portrait({
  src, name, sizes = "100vw", priority = false, dominantColor, className = "", monogramClassName = "text-5xl",
}: {
  src?: string | null; name: string; sizes?: string; priority?: boolean; dominantColor?: string | null;
  className?: string; monogramClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  const tone = toneFor(name);
  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center font-display italic ${monogramClassName} ${className}`} style={{ background: tone.bg, color: tone.fg }} aria-hidden="true">
        {monogram(name)}
      </div>
    );
  }
  return (
    <div className={`overflow-hidden ${className}`} style={{ background: dominantColor || tone.bg }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src.startsWith("/api/media/") ? `${src.split("?")[0]}?w=640` : src}
        srcSet={mediaSrcSet(src)}
        sizes={sizes}
        alt=""
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
