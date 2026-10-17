// Tonight / Plans (P1-07): time-boxed intent posts. Stored in dating_ads.
// Category and expiry values must match supabase/migrations/20261023_tonight_plans.sql.

export const PLAN_CATEGORIES = [
  { value: "DATE", label: "Drinks & a date" },
  { value: "CASUAL", label: "Casual" },
  { value: "COUPLES", label: "Couples & threesomes" },
  { value: "KINK", label: "Kink & play" },
  { value: "PARTY", label: "Party or club" },
  { value: "CHAT", label: "Chat & online" },
];

/** Expiry choices; stored as validity_days, enforced via expires_at. */
export const PLAN_DURATIONS = [
  { days: 1, label: "Tonight · 24 h" },
  { days: 3, label: "This weekend · 72 h" },
  { days: 7, label: "This week · 7 days" },
];

/** Who may reply: the reply symbols the messages route already enforces. Empty = everyone. */
export const PLAN_REPLY_TYPES = [
  { value: "♀", label: "Women" },
  { value: "♂", label: "Men" },
  { value: "👫", label: "Couples" },
  { value: "⚧", label: "Trans & non-binary" },
];

export const MAX_LIVE_PLANS = 3;

const CATEGORY_VALUES = new Set(PLAN_CATEGORIES.map((item) => item.value));
const DURATION_DAYS = new Set(PLAN_DURATIONS.map((item) => item.days));
const REPLY_VALUES = new Set(PLAN_REPLY_TYPES.map((item) => item.value));

export function planCategoryLabel(value) {
  return PLAN_CATEGORIES.find((item) => item.value === value)?.label ?? "Plan";
}

/**
 * Validates and normalises a new Plan. Returns { error } or { plan } with
 * database column names (author fields are added by the server).
 * @param {Record<string, unknown>} input @param {Date} [now]
 */
export function validatePlanInput(input, now = new Date()) {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const text = typeof input.text === "string" ? input.text.trim() : "";
  const category = typeof input.category === "string" ? input.category : "";
  const days = Number(input.validityDays);
  const minAge = input.minAge === undefined ? 18 : Number(input.minAge);
  const maxAge = input.maxAge === undefined ? 99 : Number(input.maxAge);
  if (!CATEGORY_VALUES.has(category)) return { error: "Choose what kind of plan this is." };
  if (title.length < 3 || title.length > 80) return { error: "Give your plan a short title (3–80 characters)." };
  if (text.length < 10 || text.length > 1_000) return { error: "Describe your plan in 10–1000 characters." };
  if (!DURATION_DAYS.has(days)) return { error: "Choose how long your plan stays up." };
  if (!Number.isInteger(minAge) || !Number.isInteger(maxAge) || minAge < 18 || maxAge > 99 || minAge > maxAge) return { error: "Choose a valid age range (18+)." };
  const replyTypes = Array.isArray(input.allowedReplyGenders)
    ? [...new Set(input.allowedReplyGenders.filter((value) => typeof value === "string" && REPLY_VALUES.has(value)))]
    : [];
  return {
    plan: {
      category, title, text,
      validity_days: days,
      expires_at: new Date(now.getTime() + days * 86_400_000).toISOString(),
      allowed_reply_genders: replyTypes,
      min_age: minAge,
      max_age: maxAge,
      require_verified: input.requireVerified === true,
      require_media: input.requireMedia === true,
    },
  };
}

/** A Plan is live while active, unexpired and not rejected by moderation. */
export function isPlanLive(row, now = new Date()) {
  return row.status === "active" && row.moderation_status !== "REJECTED" && new Date(row.expires_at).getTime() > now.getTime();
}

/** "Ends in 5 h" / "Ends in 2 days" — never shows past or zero. */
export function endsInLabel(expiresAt, now = new Date()) {
  const hours = Math.max(1, Math.ceil((new Date(expiresAt).getTime() - now.getTime()) / 3_600_000));
  return hours < 48 ? `Ends in ${hours} h` : `Ends in ${Math.ceil(hours / 24)} days`;
}
