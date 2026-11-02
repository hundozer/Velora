"use client";

import React from "react";
import { useTranslation, LANGUAGES, type SupportedLanguage } from "@/context/LanguageContext";

/** Flags as SVG: emoji flags don't render on Windows. */
export function Flag({ code, className = "h-5 w-auto" }: { code: SupportedLanguage; className?: string }) {
  if (code === "cs") {
    return (
      <svg viewBox="0 0 30 20" className={className} aria-hidden focusable="false">
        <rect width="30" height="10" fill="#fff" />
        <rect y="10" width="30" height="10" fill="#d7141a" />
        <path d="M0 0 15 10 0 20Z" fill="#11457e" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 60 30" className={className} aria-hidden focusable="false">
      <clipPath id="gb-s"><path d="M0 0v30h60V0z" /></clipPath>
      <clipPath id="gb-t"><path d="M30 15h30v15zv15H0zH0V0zV0h30z" /></clipPath>
      <g clipPath="url(#gb-s)">
        <path d="M0 0v30h60V0z" fill="#012169" />
        <path d="M0 0l60 30m0-30L0 30" stroke="#fff" strokeWidth="6" />
        <path d="M0 0l60 30m0-30L0 30" clipPath="url(#gb-t)" stroke="#C8102E" strokeWidth="4" />
        <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10" />
        <path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

/**
 * Czech / English. "hero" is the big chooser on the homepage; "compact" sits in the header;
 * "list" is for the You page and settings. Every variant switches the whole site at once.
 */
export function LanguageSwitch({ variant = "compact", className = "" }: { variant?: "hero" | "compact" | "list"; className?: string }) {
  const { language, setLanguage } = useTranslation();

  if (variant === "hero") {
    return (
      <div role="group" aria-label="Jazyk / Language" className={`grid grid-cols-2 gap-3 ${className}`}>
        {LANGUAGES.map((lang) => {
          const active = language === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              lang={lang.code}
              onClick={() => setLanguage(lang.code)}
              aria-pressed={active}
              className={`flex min-h-16 items-center justify-center gap-3 rounded-2xl border-2 px-4 text-[17px] font-semibold transition sm:min-h-[4.5rem] sm:text-[19px] ${active ? "border-velora-accent bg-velora-accent/10 text-velora-ink" : "border-velora-line text-velora-ink2 hover:border-velora-ink/40 hover:text-velora-ink"}`}
            >
              <Flag code={lang.code} className="h-7 w-auto rounded-[3px] shadow-sm sm:h-8" />
              {lang.nativeName}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div role="group" aria-label="Jazyk / Language" className={`grid grid-cols-2 gap-2 ${className}`}>
        {LANGUAGES.map((lang) => (
          <button key={lang.code} type="button" lang={lang.code} onClick={() => setLanguage(lang.code)} aria-pressed={language === lang.code}
            className={`flex min-h-12 items-center justify-center gap-2.5 rounded-xl border px-3 text-[15px] font-semibold ${language === lang.code ? "border-velora-accent bg-velora-accent/10 text-velora-ink" : "border-velora-line text-velora-ink2"}`}>
            <Flag code={lang.code} className="h-5 w-auto rounded-[2px]" />{lang.nativeName}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div role="group" aria-label="Jazyk / Language" className={`inline-flex items-center rounded-full border border-velora-line p-1 ${className}`}>
      {LANGUAGES.map((lang) => {
        const active = language === lang.code;
        return (
          <button key={lang.code} type="button" lang={lang.code} onClick={() => setLanguage(lang.code)} aria-pressed={active} aria-label={lang.nativeName} title={lang.nativeName}
            className={`flex h-8 min-w-9 items-center justify-center gap-1.5 rounded-full px-2 text-[12px] font-bold uppercase tracking-wide transition sm:px-2.5 ${active ? "bg-velora-surface text-velora-ink" : "text-velora-muted opacity-60 hover:text-velora-ink hover:opacity-100"}`}>
            <Flag code={lang.code} className="h-3.5 w-auto rounded-[2px]" /><span className="hidden sm:inline">{lang.code === "cs" ? "CZ" : "EN"}</span>
          </button>
        );
      })}
    </div>
  );
}
