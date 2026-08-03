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
    "inline-flex items-center justify-center font-medium transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-velora-gold/50 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    gold: "bg-gold-gradient text-velora-bg hover:brightness-110 shadow-gold-glow border border-velora-amber/40 active:scale-[0.98]",
    glass:
      "bg-white/5 text-velora-textPrimary hover:bg-white/10 border border-white/10 backdrop-blur-md hover:border-velora-gold/40 active:scale-[0.98]",
    outline:
      "bg-transparent text-velora-gold border border-velora-gold/50 hover:bg-velora-gold/10 hover:border-velora-gold active:scale-[0.98]",
    danger:
      "bg-velora-crimson/80 text-white hover:bg-velora-crimson border border-red-500/30 active:scale-[0.98]",
    ghost:
      "bg-transparent text-velora-textSecondary hover:text-velora-textPrimary hover:bg-white/5 active:scale-[0.98]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs tracking-wider uppercase font-semibold",
    md: "px-5 py-2.5 text-sm tracking-wide font-medium",
    lg: "px-7 py-3.5 text-base tracking-wide font-semibold",
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
