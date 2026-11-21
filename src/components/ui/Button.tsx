"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "gold" | "glass" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "gold",
  size = "md",
  className,
  children,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-colors duration-200 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-velora-accent disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    // Brand (docs/brand/BRAND.md §6): "gold" is the main action — Ember pill, one per view.
    gold: "bg-velora-warm text-velora-paper hover:bg-velora-warmHover border border-velora-warm font-semibold",
    glass:
      "bg-transparent text-velora-ink border border-velora-ink/30 hover:border-velora-ink",
    outline:
      "bg-transparent text-velora-ink border border-velora-ink/30 hover:border-velora-ink",
    danger:
      "bg-velora-crimson text-velora-paper hover:brightness-110 border border-velora-crimson/30 active:scale-[0.98]",
    ghost:
      "bg-transparent text-velora-textSecondary hover:text-velora-textPrimary hover:bg-ink/5 active:scale-[0.98]",
  };

  const sizes = {
    sm: "px-3.5 py-1.5 text-xs font-semibold",
    md: "px-5 py-2.5 text-sm font-semibold",
    lg: "px-7 py-3.5 text-base font-semibold",
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      {...props}
    >
      {children}
    </button>
  );
};
