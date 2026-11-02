// Words People, Profile and Messages use about a member. Pronouns follow the gender the
// member declared; anyone else (couples, non-binary, unknown) gets "their".

/** "her" | "his" | "their" */
export function possessive(person) {
  if (person?.isCoupleProfile) return "their";
  const gender = String(person?.gender || "").toUpperCase();
  if (gender === "FEMALE") return "her";
  if (gender === "MALE") return "his";
  return "their";
}

/** "she" | "he" | "they" */
export function subject(person) {
  const word = possessive(person);
  return word === "her" ? "she" : word === "his" ? "he" : "they";
}

export const PRESENCE_WORDS = { ONLINE: "Here now", TODAY: "Earlier today", WEEK: "This week" };

const same = (text) => text;

/** "Here now · Holešovice · 29" — only what the member chose to show. Pass `t` to translate the words. */
export function statusLine(person, t = same) {
  return [person?.presence ? t(PRESENCE_WORDS[person.presence]) : null, person?.areaName, person?.isCoupleProfile ? t("couple") : person?.age].filter(Boolean).join(" · ");
}

/** Index meta: "29 · Holešovice" or "Couple · Vinohrady". Pass `t` to translate the words. */
export function metaLine(person, t = same) {
  return [person?.isCoupleProfile ? t("Couple") : person?.age, person?.areaName].filter(Boolean).join(" · ");
}

/** The member's own words, if they wrote any (never a placeholder). */
export function ownWords(person) {
  const text = String(person?.headline || "").trim();
  return text.length ? text : null;
}
