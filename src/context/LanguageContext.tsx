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
    const saved = localStorage.getItem("velora_lang") as SupportedLanguage;
    if (saved && DICTIONARIES[saved]) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem("velora_lang", lang);
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
