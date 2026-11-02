import cs from "@/locales/cs/phrases.json";

/**
 * Intimo is bilingual: English and Czech. English text is the key, so anything
 * without a Czech entry falls back to English instead of showing a key.
 * Translations live in src/locales/cs/phrases.json.
 */
export type Lang = "en" | "cs";
export const LANGS: Lang[] = ["en", "cs"];
export const LANG_COOKIE = "intimo_lang";
export const LOCALE: Record<Lang, string> = { en: "en-GB", cs: "cs-CZ" };

const DICTIONARY: Record<Lang, Record<string, string>> = { en: {}, cs: cs as Record<string, string> };
export type Vars = Record<string, string | number | null | undefined>;

export function isLang(value: unknown): value is Lang {
  return value === "en" || value === "cs";
}

/** Czech for visitors in the Czech Republic or whose browser prefers Czech; English otherwise. */
export function detectLang(country: string | null | undefined, acceptLanguage: string | null | undefined): Lang {
  if ((country || "").toUpperCase() === "CZ") return "cs";
  const first = (acceptLanguage || "").split(",")[0]?.trim().toLowerCase() || "";
  return first.startsWith("cs") ? "cs" : "en";
}

/** Non-strings (numbers, elements, null) pass through unchanged. */
export type Translated<T> = T extends string ? string : T;

type Pattern = { re: RegExp; names: string[]; key: string };
const PATTERNS: Partial<Record<Lang, Pattern[]>> = {};
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/**
 * Sentences built elsewhere with values already filled in ("Lena asks men to introduce
 * themselves first.") are matched against the dictionary's {placeholder} entries. Only
 * patterns with enough fixed wording are used, so members' own words are never rewritten.
 */
function patterns(lang: Lang): Pattern[] {
  if (PATTERNS[lang]) return PATTERNS[lang]!;
  const list: Pattern[] = [];
  for (const key of Object.keys(DICTIONARY[lang])) {
    if (!key.includes("{")) continue;
    const fixed = key.replace(/\{\w+\}/g, "");
    if (fixed.replace(/[^A-Za-z]/g, "").length < 12) continue;
    const names: string[] = [];
    const source = key.split(/(\{\w+\})/).map((part) => {
      const m = part.match(/^\{(\w+)\}$/);
      if (!m) return escape(part);
      names.push(m[1]);
      return "(.+?)";
    }).join("");
    list.push({ re: new RegExp(`^${source}$`), names, key });
  }
  // Most specific first: "… for {audience}. Verify your photo to reply." before "… for {audience}."
  const fixedLength = (key: string) => key.replace(/\{\w+\}/g, "").length;
  list.sort((a, b) => fixedLength(b.key) - fixedLength(a.key));
  return (PATTERNS[lang] = list);
}

function fromPattern(lang: Lang, text: string): string | null {
  for (const { re, names, key } of patterns(lang)) {
    const m = text.match(re);
    if (!m) continue;
    const vars: Vars = {};
    names.forEach((name, i) => { const value = m[i + 1]; vars[name] = DICTIONARY[lang][value] || value; });
    return DICTIONARY[lang][key].replace(/\{(\w+)\}/g, (match, k: string) => (k in vars ? String(vars[k] ?? "") : match));
  }
  return null;
}

export function translate<T>(lang: Lang, input: T, vars?: Vars): Translated<T> {
  if (typeof input !== "string") return input as Translated<T>;
  const text: string = input;
  let out = lang === "en" ? text : DICTIONARY[lang][text] || (!vars && text.length < 400 && fromPattern(lang, text)) || text;
  if (vars) out = out.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key] ?? "") : match));
  return out as Translated<T>;
}

// The language of the page currently rendering, for code that runs outside React components
// (helpers, event handlers). Set by LanguageProvider.
let current: Lang = "en";
export function setCurrentLang(lang: Lang) { current = lang; }
export function currentLang(): Lang { return current; }
/** Translate outside a component. Inside components use `const { t } = useTranslation()`. */
export function tr<T>(text: T, vars?: Vars): Translated<T> { return translate(current, text, vars); }
