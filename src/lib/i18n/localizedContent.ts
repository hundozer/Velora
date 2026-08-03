import { SupportedLanguage } from "@/context/LanguageContext";

/**
 * Returns localized database content field or falls back to original text.
 */
export function getLocalizedField<T extends Record<string, any>>(
  item: T,
  fieldPrefix: string,
  currentLanguage: SupportedLanguage
): string {
  const langKey = `${fieldPrefix}_${currentLanguage}`;
  if (item[langKey] && typeof item[langKey] === "string" && item[langKey].trim()) {
    return item[langKey];
  }

  const enKey = `${fieldPrefix}_en`;
  if (item[enKey] && typeof item[enKey] === "string" && item[enKey].trim()) {
    return item[enKey];
  }

  return item[fieldPrefix] || "";
}
