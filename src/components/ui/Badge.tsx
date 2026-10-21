"use client";

import React from "react";
import { CheckCircle2, Crown, Users, ShieldAlert } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface BadgeProps {
  type: "verified" | "creator" | "couple" | "admin" | "online" | "custom";
  label?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, label, className }) => {
  switch (type) {
    case "verified":
      return (
        <span
          className={twMerge(
            clsx(
              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-velora-gold/15 text-velora-gold border border-velora-gold/30 backdrop-blur-md",
              className
            )
          )}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-velora-gold fill-velora-gold/20" />
          {label || "Verified Adult"}
        </span>
      );
    case "creator":
      return (
        <span
          className={twMerge(
            clsx(
              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-velora-accent/15 text-velora-accent border border-velora-accent/30 backdrop-blur-md",
              className
            )
          )}
        >
          <Crown className="w-3.5 h-3.5 text-velora-accent" />
          {label || "Creator"}
        </span>
      );
    case "couple":
      return (
        <span
          className={twMerge(
            clsx(
              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-velora-signal border border-purple-500/30 backdrop-blur-md",
              className
            )
          )}
        >
          <Users className="w-3.5 h-3.5 text-velora-signal" />
          {label || "Couple"}
        </span>
      );
    case "admin":
      return (
        <span
          className={twMerge(
            clsx(
              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-velora-danger border border-red-500/30 backdrop-blur-md",
              className
            )
          )}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-velora-danger" />
          {label || "Admin"}
        </span>
      );
    case "online":
      return (
        <span className={twMerge("inline-flex items-center gap-1.5 text-xs text-velora-success font-medium", className)}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          {label || "Active Now"}
        </span>
      );
    default:
      return (
        <span
          className={twMerge(
            clsx(
              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-ink/10 text-velora-textPrimary border border-ink/10",
              className
            )
          )}
        >
          {label}
        </span>
      );
  }
};
