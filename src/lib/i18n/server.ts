import { cookies, headers } from "next/headers";
import { detectLang, isLang, LANG_COOKIE, translate, type Lang, type Vars } from "./translate";

/** The visitor's language on the server: their saved choice, else where they are and what their browser prefers. */
export function serverLang(): Lang {
  const saved = cookies().get(LANG_COOKIE)?.value;
  if (isLang(saved)) return saved;
  const h = headers();
  return detectLang(h.get("x-vercel-ip-country"), h.get("accept-language"));
}

/** Translator for server components. */
export function serverT() {
  const lang = serverLang();
  return (text: string, vars?: Vars) => translate(lang, text, vars);
}
