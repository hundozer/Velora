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

/** Legacy expiry choices, kept so older rows still read correctly. New plans use start and end times. */
export const PLAN_DURATIONS = [
  { days: 1, label: "Tonight · 24 h" },
  { days: 3, label: "This weekend · 72 h" },
  { days: 7, label: "This week · 7 days" },
];

/** A plan must start within this window from now… */
export const PLAN_START_HORIZON_MS = 36 * 3_600_000;
/** …may have started a few minutes ago (clock skew, slow forms)… */
export const PLAN_START_GRACE_MS = 10 * 60_000;
/** …and lasts between 30 minutes and 12 hours. */
export const PLAN_MIN_DURATION_MS = 30 * 60_000;
export const PLAN_MAX_DURATION_MS = 12 * 3_600_000;

/** Who may reply: the reply symbols the messages route already enforces. Empty = everyone. */
export const PLAN_REPLY_TYPES = [
  { value: "♀", label: "Women" },
  { value: "♂", label: "Men" },
  { value: "👫", label: "Couples" },
  { value: "⚧", label: "Trans & non-binary" },
];

export const MAX_LIVE_PLANS = 3;

const CATEGORY_VALUES = new Set(PLAN_CATEGORIES.map((item) => item.value));
const REPLY_VALUES = new Set(PLAN_REPLY_TYPES.map((item) => item.value));

export function planCategoryLabel(value) {
  return PLAN_CATEGORIES.find((item) => item.value === value)?.label ?? "Plan";
}

/**
 * Validates and normalises a new Plan. Returns { error } or { plan } with
 * database column names (author fields are added by the server).
 * @param {Record<string, unknown>} input @param {Date} [now]
 */
export function validatePlanInput(input, now = new Date(), trustedEventWindow = null) {
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const text = typeof input.text === "string" ? input.text.trim() : "";
  const category = typeof input.category === "string" ? input.category : "";
  const startsAt = typeof input.startsAt === "string" ? new Date(input.startsAt) : null;
  const endsAt = typeof input.endsAt === "string" ? new Date(input.endsAt) : null;
  const minAge = input.minAge === undefined ? 18 : Number(input.minAge);
  const maxAge = input.maxAge === undefined ? 99 : Number(input.maxAge);
  if (!CATEGORY_VALUES.has(category)) return { error: "Choose what kind of plan this is." };
  if (title.length < 3 || title.length > 80) return { error: "Give your plan a short title (3–80 characters)." };
  if (text.length < 10 || text.length > 1_000) return { error: "Describe your plan in 10–1000 characters." };
  if (!startsAt || Number.isNaN(startsAt.getTime()) || !endsAt || Number.isNaN(endsAt.getTime())) return { error: "Choose when your plan starts and ends." };
  if (trustedEventWindow) {
    if (startsAt.toISOString() !== trustedEventWindow.startsAt || endsAt.toISOString() !== trustedEventWindow.endsAt) return { error: "The event time changed. Refresh the event and review your invitation." };
  } else if (startsAt.getTime() < now.getTime() - PLAN_START_GRACE_MS || startsAt.getTime() > now.getTime() + PLAN_START_HORIZON_MS) return { error: "Plans start within the next 36 hours." };
  const duration = endsAt.getTime() - startsAt.getTime();
  if (duration < PLAN_MIN_DURATION_MS || duration > PLAN_MAX_DURATION_MS) return { error: "Plans last between 30 minutes and 12 hours." };
  if (!Number.isInteger(minAge) || !Number.isInteger(maxAge) || minAge < 18 || maxAge > 99 || minAge > maxAge) return { error: "Choose a valid age range (18+)." };
  const replyTypes = Array.isArray(input.allowedReplyGenders)
    ? [...new Set(input.allowedReplyGenders.filter((value) => typeof value === "string" && REPLY_VALUES.has(value)))]
    : [];
  return {
    plan: {
      category, title, text,
      // validity_days is a legacy NOT NULL column; every new plan fits in one day.
      validity_days: 1,
      starts_at: startsAt.toISOString(),
      expires_at: endsAt.toISOString(),
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

/** Start of a plan; rows written before start times existed started when created. */
export function planStartsAt(row) {
  return row.starts_at || row.created_at;
}
