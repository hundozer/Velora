/**
 * FM-09: optional identity details, each with its own audience.
 * Pure helpers shared by the editor, PUT /api/profile/identity and the profile serializer.
 */

export const ORIENTATIONS = [
  { value: "HETEROSEXUAL", label: "Straight" },
  { value: "BISEXUAL", label: "Bisexual" },
  { value: "HOMOSEXUAL", label: "Gay or lesbian" },
  { value: "PANSEXUAL", label: "Pansexual" },
  { value: "FLUID", label: "Fluid" },
  { value: "QUEER", label: "Queer" },
];
export const PRONOUN_SUGGESTIONS = ["she/her", "he/him", "they/them"];
export const AUDIENCES = ["MEMBERS_ONLY", "FRIENDS_ONLY", "PRIVATE"];
export const IDENTITY_KEYS = ["orientation", "gender_note", "pronouns"];
// New details start private, except pronouns, which exist to be seen.
export const DEFAULT_VISIBILITY = { orientation: "PRIVATE", gender_note: "PRIVATE", pronouns: "MEMBERS_ONLY" };
export const LIMITS = { note: 60, pronouns: 24 };

const ORIENTATION_VALUES = new Set(ORIENTATIONS.map((item) => item.value));

/**
 * Normalises free text: no control characters, single spaces, trimmed. Refuses anything that
 * looks like contact details or a link, so identity fields can't carry phone numbers or URLs.
 * Returns null for empty, or { error } when refused.
 */
export function cleanNote(value, max) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return { error: "invalid" };
  const text = value.replace(/[\u0000-\u001f\u007f\u200b-\u200f\u2028\u2029\ufeff]/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return null;
  if ([...text].length > max) return { error: "too_long" };
  if (/https?:|www\.|@|\.(com|cz|net|org|io|me|app)\b|\d{6,}/i.test(text.replace(/\s/g, ""))) return { error: "contact" };
  return text;
}

/**
 * Validates an editor submission. Returns { value } with DB columns, or { error, field }.
 * Every key must be present: the editor always sends the whole form.
 */
export function cleanIdentityInput(input) {
  if (!input || typeof input !== "object") return { error: "invalid", field: "form" };
  // Missing, null or empty all mean "not set".
  const orientation = input.orientation === undefined || input.orientation === null || input.orientation === "" ? null : input.orientation;
  if (orientation !== null && !ORIENTATION_VALUES.has(orientation)) return { error: "invalid", field: "orientation" };
  const notes = { orientation_note: cleanNote(input.orientationNote, LIMITS.note), gender_note: cleanNote(input.genderNote, LIMITS.note), pronouns: cleanNote(input.pronouns, LIMITS.pronouns) };
  for (const [field, value] of Object.entries(notes)) if (value && typeof value === "object") return { error: value.error, field };
  const visibility = {};
  for (const key of IDENTITY_KEYS) {
    const audience = input.visibility?.[key] ?? DEFAULT_VISIBILITY[key];
    if (!AUDIENCES.includes(audience)) return { error: "invalid", field: `visibility.${key}` };
    visibility[key] = audience;
  }
  return { value: { sexual_orientation: orientation, ...notes, identity_visibility: visibility } };
}

/** True when the submission stores special-category data, so consent is required first. */
export function needsSensitiveConsent(value) {
  return Boolean(value.sexual_orientation || value.orientation_note || value.gender_note);
}

function allowed(audience, viewer) {
  if (viewer.owner) return true;
  return audience === "MEMBERS_ONLY" || (audience === "FRIENDS_ONLY" && viewer.friends === true);
}

/**
 * What a viewer may see of a profile row's identity details. A row loaded without
 * identity_visibility (a narrow column list) shows nothing, so a missing column can never
 * widen an audience. Before FM-09, orientation followed sensitive_fields_visibility; an empty
 * map keeps that rule for orientation only.
 */
export function visibleIdentity(row, viewer = {}) {
  if (!row || row.identity_visibility === undefined || row.identity_visibility === null) return {};
  const map = typeof row.identity_visibility === "object" ? row.identity_visibility : {};
  const audience = {
    orientation: map.orientation ?? (["EVERYONE", "MEMBERS_ONLY", "FRIENDS_ONLY"].includes(row.sensitive_fields_visibility) ? (row.sensitive_fields_visibility === "FRIENDS_ONLY" ? "FRIENDS_ONLY" : "MEMBERS_ONLY") : "PRIVATE"),
    gender_note: map.gender_note ?? DEFAULT_VISIBILITY.gender_note,
    pronouns: map.pronouns ?? DEFAULT_VISIBILITY.pronouns,
  };
  const out = {};
  if (allowed(audience.orientation, viewer)) {
    if (row.sexual_orientation) out.sexualOrientation = row.sexual_orientation;
    if (row.orientation_note) out.orientationNote = row.orientation_note;
  }
  if (row.gender_note && allowed(audience.gender_note, viewer)) out.genderNote = row.gender_note;
  if (row.pronouns && allowed(audience.pronouns, viewer)) out.pronouns = row.pronouns;
  return out;
}

/**
 * True when a Supabase error means "that column doesn't exist yet" (the FM-09 migration is
 * not applied). PostgreSQL reports 42703; PostgREST reports PGRST204 for writes whose column
 * is missing from its schema cache.
 */
export function isMissingColumnError(error) {
  return error?.code === "42703" || error?.code === "PGRST204";
}
