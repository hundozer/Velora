"use client";

import { useTranslation } from "@/context/LanguageContext";
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
  const { t } = useTranslation();
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={props.id} className="block text-xs font-semibold uppercase tracking-wider text-velora-ink2 mb-2">
            {t(label)}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && <div className="absolute left-4 text-velora-muted">{icon}</div>}
          <input
            ref={ref}
            aria-invalid={error ? true : props["aria-invalid"]}
            className={twMerge(
              clsx(
                "w-full min-h-11 bg-velora-surface border border-velora-control rounded-2xl py-3 text-sm text-velora-ink placeholder:text-velora-muted focus:border-velora-accent focus:ring-2 focus:ring-velora-accent/30 transition-all",
                icon ? "pl-11 pr-4" : "px-4",
                error && "border-red-500/60 focus:border-red-500 focus:ring-red-500",
                className
              )
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-velora-danger font-medium">{t(error)}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
