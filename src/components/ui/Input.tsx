"use client";

import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-velora-textSecondary mb-2">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && <div className="absolute left-4 text-velora-textMuted">{icon}</div>}
          <input
            ref={ref}
            className={twMerge(
              clsx(
                "w-full bg-white/5 border border-white/10 rounded-2xl py-3 text-sm text-velora-textPrimary placeholder:text-velora-textMuted focus:outline-none focus:border-velora-gold/60 focus:ring-1 focus:ring-velora-gold/60 transition-all backdrop-blur-md",
                icon ? "pl-11 pr-4" : "px-4",
                error && "border-red-500/60 focus:border-red-500 focus:ring-red-500",
                className
              )
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-red-400 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
