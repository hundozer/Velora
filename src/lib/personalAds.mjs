export const PERSONAL_CATEGORIES = [
  { value: "HOOKUP", label: "Hookups & casual sex" },
  { value: "FUCK_BUDDY", label: "Regular sex / fuck buddy" },
  { value: "COUPLES", label: "Couples & threesomes" },
  { value: "GROUP", label: "Group sex & swingers" },
  { value: "KINK", label: "BDSM & kink" },
  { value: "ONLINE", label: "Sexting & online sex" },
];
const CATEGORIES = new Set(PERSONAL_CATEGORIES.map(item => item.value));
const REPLY_TYPES = new Set(["♀", "♂", "👫", "⚧"]);
export function categoryLabel(value) { return PERSONAL_CATEGORIES.find(item => item.value === value)?.label || "Dating ad"; }
// Immediate publication requires a minimum deterministic safety gate. This catches
// outside contacts and explicit prices; it does not replace moderation and reports.
// Keep checks specific to avoid blocking normal adult/consensual sexual language.
export function validateDatingAdContent(text) {
  if (/https?:\/\/|www\.|(?:instagram|telegram|whatsapp|snapchat|signal|onlyfans)\s*[:@]/i.test(text)
    || /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)
    || /(?:^|\s)@[a-z][a-z0-9._]{2,}\b/i.test(text)
    || /(?:\+\d{1,3}[\s.-]?)?(?:\d[\s.-]?){9,15}/.test(text)) {
    return "Keep contact details on Intimo. External links, handles, emails and phone numbers are not allowed in dating ads.";
  }
  if (/(?:€|\$|£|Kč)\s*\d+|\b\d+(?:[.,]\d+)?\s*(?:€|EUR|USD|CZK|Kč|GBP)\b/i.test(text)) {
    return "Dating ads cannot offer paid services or list prices.";
  }
  return null;
}

export function validatePersonalAd(input) {
  const category = typeof input.category === "string" ? input.category : "";
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const body = typeof input.body === "string" ? input.body.trim() : "";
  const boundaries = typeof input.boundaries === "string" ? input.boundaries.trim() : "";
  const minAge = Number(input.minAge ?? 18), maxAge = Number(input.maxAge ?? 99);
  const days = Number(input.days ?? 7);
  if (!CATEGORIES.has(category)) return { error: "Choose what kind of sex or connection you're looking for." };
  if (title.length < 3 || title.length > 100 || body.length < 20 || body.length > 2000) return { error: "Use a title of 3–100 characters and 20–2000 characters of detail." };
  if (boundaries.length < 3 || boundaries.length > 500) return { error: "Say what is off-limits (3–500 characters)." };
  const contentError = validateDatingAdContent([title, body, boundaries].join(" "));
  if (contentError) return { error: contentError };
  if (!Number.isInteger(minAge) || !Number.isInteger(maxAge) || minAge < 18 || maxAge > 99 || minAge > maxAge) return { error: "Choose an adult age range." };
  if (![7, 30].includes(days)) return { error: "Choose 7 or 30 days." };
  const allowedReplyGenders = Array.isArray(input.allowedReplyGenders) ? [...new Set(input.allowedReplyGenders.filter(value => REPLY_TYPES.has(value)))] : [];
  return { ad: { category, title, body, boundaries, min_age: minAge, max_age: maxAge, require_verified: input.requireVerified === true, allowed_reply_genders: allowedReplyGenders, days } };
}
