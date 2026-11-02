"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import en from "@/locales/en/common.json";
import cs from "@/locales/cs/common.json";
import { isLang, LANG_COOKIE, LOCALE, setCurrentLang, translate, type Lang, type Translated, type Vars } from "@/lib/i18n/translate";

export type SupportedLanguage = Lang;

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
}

/** Intimo is fully available in these languages. Czech is the default for visitors in the Czech Republic. */
export const LANGUAGES: LanguageInfo[] = [
  { code: "cs", name: "Czech", nativeName: "Čeština" },
  { code: "en", name: "English", nativeName: "English" },
];
export const AVAILABLE_LANGUAGES = LANGUAGES;

const KEYED: Record<Lang, Record<string, unknown>> = { en, cs };

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  /** t("English text", { name }) → the text in the current language. Dotted keys ("nav.people") use common.json. */
  t: <T>(text: T, vars?: Vars) => Translated<T>;
  /** The current locale for Intl/toLocale* calls ("cs-CZ" / "en-GB"). */
  locale: string;
  formatDate: (date: Date | string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function keyed(lang: Lang, key: string): string | null {
  let node: unknown = KEYED[lang];
  for (const part of key.split(".")) {
    if (node && typeof node === "object" && part in (node as Record<string, unknown>)) node = (node as Record<string, unknown>)[part];
    else return null;
  }
  return typeof node === "string" ? node : null;
}

export const LanguageProvider: React.FC<{ children: React.ReactNode; initialLanguage?: Lang }> = ({ children, initialLanguage = "en" }) => {
  const router = useRouter();
  const [language, setLanguageState] = useState<Lang>(initialLanguage);
  // Helpers outside components translate with tr(); keep it on the language being rendered.
  setCurrentLang(language);

  useEffect(() => {
    // The choice now lives in a cookie the server can read; drop the old device-only keys.
    try { localStorage.removeItem("intimo_lang"); localStorage.removeItem("velora_lang"); } catch { /* storage unavailable */ }
  }, []);

  const setLanguage = useCallback((lang: Lang) => {
    if (!isLang(lang)) return;
    document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = lang;
    setCurrentLang(lang);
    setLanguageState(lang);
    router.refresh();
  }, [router]);

  const t = useCallback(<T,>(text: T, vars?: Vars): Translated<T> => {
    if (typeof text === "string" && /^[a-z]+(\.[a-z_]+)+$/.test(text)) {
      const value = keyed(language, text) ?? keyed("en", text);
      if (value) return value as Translated<T>;
    }
    return translate(language, text, vars);
  }, [language]);

  const value = useMemo<LanguageContextType>(() => ({
    language,
    setLanguage,
    t,
    locale: LOCALE[language],
    formatDate: (input: Date | string) => {
      const date = typeof input === "string" ? new Date(input) : input;
      if (isNaN(date.getTime())) return String(input);
      return new Intl.DateTimeFormat(LOCALE[language], { year: "numeric", month: "long", day: "numeric" }).format(date);
    },
  }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useTranslation must be used within a LanguageProvider");
  return context;
};
