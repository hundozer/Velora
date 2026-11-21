"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "solid" | "goldBorder";
  hoverEffect?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = "glass",
  hoverEffect = true,
  className,
  children,
  ...props
}) => {
  const baseStyles = "rounded-2xl overflow-hidden transition-colors duration-200 relative";

  const variants = {
    glass: "glass-panel",
    solid: "bg-velora-card border border-velora-border",
    goldBorder: "glass-panel-gold",
  };

  const hoverStyles = hoverEffect
    ? "hover:border-velora-ink/40" // flat print look: no lift, no shadow (BRAND.md §6)
    : "";

  return (
    <div className={twMerge(clsx(baseStyles, variants[variant], hoverStyles, className))} {...props}>
      {children}
    </div>
  );
};
