"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import en from "@/locales/en/common.json";
import cs from "@/locales/cs/common.json";
import hu from "@/locales/hu/common.json";
import ro from "@/locales/ro/common.json";
import sk from "@/locales/sk/common.json";
import de from "@/locales/de/common.json";

export type SupportedLanguage = "en" | "cs" | "hu" | "ro" | "sk" | "de";

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "cs", name: "Czech", nativeName: "Čeština", flag: "🇨🇿" },
  { code: "hu", name: "Hungarian", nativeName: "Magyar", flag: "🇭🇺" },
  { code: "ro", name: "Romanian", nativeName: "Română", flag: "🇷🇴" },
  { code: "sk", name: "Slovak", nativeName: "Slovenčina", flag: "🇸🇰" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
];

const DICTIONARIES: Record<SupportedLanguage, any> = { en, cs, hu, ro, sk, de };

/**
 * Languages members can actually choose. Only the navigation labels are translated so far
 * and every page is English, so offering the others would promise translations that don't
 * exist. Add a code here once that language covers the whole app; the pickers reappear
 * automatically when there is more than one.
 */
export const AVAILABLE_LANGUAGES: LanguageInfo[] = LANGUAGES.filter((lang) => lang.code === "en");
const AVAILABLE = new Set(AVAILABLE_LANGUAGES.map((lang) => lang.code));

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
  formatDate: (date: Date | string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>("en");

  useEffect(() => {
    const saved = (localStorage.getItem("intimo_lang") || localStorage.getItem("velora_lang")) as SupportedLanguage;
    if (saved && DICTIONARIES[saved] && AVAILABLE.has(saved)) {
      setLanguageState(saved);
      localStorage.setItem("intimo_lang", saved);
    } else if (saved) {
      // A language chosen before it was withdrawn: fall back to English everywhere.
      localStorage.setItem("intimo_lang", "en");
    }
    localStorage.removeItem("velora_lang");
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    if (!AVAILABLE.has(lang)) return;
    setLanguageState(lang);
    localStorage.setItem("intimo_lang", lang);
  };

  const t = (key: string): string => {
    const keys = key.split(".");
    let current = DICTIONARIES[language] || DICTIONARIES.en;

    for (const k of keys) {
      if (current && current[k] !== undefined) {
        current = current[k];
      } else {
        // Fallback to English
        let fallback = DICTIONARIES.en;
        for (const fk of keys) {
          if (fallback && fallback[fk] !== undefined) fallback = fallback[fk];
          else return key;
        }
        return typeof fallback === "string" ? fallback : key;
      }
    }

    return typeof current === "string" ? current : key;
  };

  const formatDate = (dateInput: Date | string): string => {
    const dateObj = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(dateObj.getTime())) return String(dateInput);

    const localeMap: Record<SupportedLanguage, string> = {
      en: "en-US",
      cs: "cs-CZ",
      hu: "hu-HU",
      ro: "ro-RO",
      sk: "sk-SK",
      de: "de-DE",
    };

    return new Intl.DateTimeFormat(localeMap[language], {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(dateObj);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatDate }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
};
