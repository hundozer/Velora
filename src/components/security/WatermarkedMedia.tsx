"use client";

import React from "react";
import { ShieldCheck, Lock } from "lucide-react";

interface WatermarkedMediaProps {
  src: string;
  alt?: string;
  viewerId: string;
  viewerUsername: string;
  isPrivate?: boolean;
  className?: string;
  mediaType?: "image" | "video";
}

export const WatermarkedMedia: React.FC<WatermarkedMediaProps> = ({
  src,
  alt = "Secured Vault Media",
  viewerId,
  viewerUsername,
  isPrivate = false,
  className = "w-full h-full object-cover",
  mediaType = "image",
}) => {
  const timestamp = new Date().toISOString().slice(0, 10);
  const watermarkText = `VELORA • LICENSED TO @${viewerUsername} • ID:${viewerId.slice(0, 8)} • ${timestamp}`;

  return (
    <div
      className="relative overflow-hidden select-none group"
      onContextMenu={(e) => e.preventDefault()} // Block right-click context menu
    >
      {/* Media Element */}
      {mediaType === "video" ? (
        <video
          src={src}
          className={className}
          controls
          controlsList="nodownload"
          onContextMenu={(e) => e.preventDefault()}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className={className}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />
      )}

      {/* Dynamic Diagonal Watermark Grid */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-around rotate-[-15deg] opacity-25 scale-125 z-10">
        {[1, 2, 3, 4].map((row) => (
          <div
            key={row}
            className="whitespace-nowrap text-[10px] font-mono font-bold tracking-widest text-amber-300 shadow-sm uppercase flex justify-around"
          >
            <span>{watermarkText}</span>
            <span>{watermarkText}</span>
          </div>
        ))}
      </div>

      {/* Security Badge Corner Overlay */}
      {isPrivate && (
        <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-velora-gold/40 text-[9px] font-mono font-bold text-amber-300 flex items-center gap-1 z-20 shadow-md">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>DRM PROTECTED</span>
        </div>
      )}
    </div>
  );
};
