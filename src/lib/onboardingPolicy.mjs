/**
 * @param {string} value
 * @param {Date} [today]
 */
export function ageFromBirthDate(value, today = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const birthDate = new Date(year, month - 1, day);
  if (birthDate.getFullYear() !== year || birthDate.getMonth() !== month - 1 || birthDate.getDate() !== day) return null;
  let age = today.getFullYear() - year;
  if (today.getMonth() < month - 1 || (today.getMonth() === month - 1 && today.getDate() < day)) age -= 1;
  return age;
}

/** @param {string} nickname @param {string} dateOfBirth @param {Date} [today] */
export function onboardingBasicsAreValid(nickname, dateOfBirth, today = new Date()) {
  const age = ageFromBirthDate(dateOfBirth, today);
  const length = nickname.trim().length;
  return length >= 2 && length <= 80 && age !== null && age >= 18 && age <= 120;
}

// Onboarding v3 (P1-02). Shared by the wizard and /api/profile/me so the
// client never offers a value the server would reject.

export const INDIVIDUAL_IDENTITIES = [
  { value: "FEMALE", label: "Woman" },
  { value: "MALE", label: "Man" },
  { value: "NON_BINARY", label: "Non-binary" },
  { value: "TRANSGENDER", label: "Trans" },
  { value: "OTHER", label: "Another identity" },
];

export const COUPLE_COMPOSITIONS = [
  { value: "COUPLE_MF", label: "Woman + man" },
  { value: "COUPLE_FF", label: "Two women" },
  { value: "COUPLE_MM", label: "Two men" },
  { value: "OTHER", label: "Another combination" },
];

export const RELATIONSHIP_STRUCTURES = [
  { value: "SINGLE", label: "Single", for: "SINGLE" },
  { value: "ATTACHED", label: "Partnered, exploring solo", for: "SINGLE" },
  { value: "OPEN_RELATIONSHIP", label: "Open relationship", for: "BOTH" },
  { value: "POLYAMOROUS", label: "Polyamorous", for: "BOTH" },
  { value: "COUPLE", label: "Couple, exploring together", for: "COUPLE" },
  { value: "SWINGER", label: "Swinging / lifestyle", for: "COUPLE" },
];

export const LOOKING_FOR = [
  { value: "DATES", label: "Dates" },
  { value: "CASUAL", label: "Casual" },
  { value: "FWB", label: "Friends with benefits" },
  { value: "COUPLES_THREESOMES", label: "Couples & threesomes" },
  { value: "KINK", label: "Kink & BDSM" },
  { value: "PARTIES", label: "Parties & events" },
  { value: "CHAT", label: "Chat & online" },
  { value: "SCENE_FRIENDS", label: "Friends in the scene" },
];

export const FIRST_MESSAGE_PERMISSIONS = [
  { value: "MEMBERS_ONLY", label: "Any member can write to me first" },
  { value: "PRIVATE", label: "Only people I've written to" },
];

const values = (list) => new Set(list.map((item) => item.value));
const INDIVIDUAL = values(INDIVIDUAL_IDENTITIES);
const COUPLE = values(COUPLE_COMPOSITIONS);
const LOOKING = values(LOOKING_FOR);
const MESSAGE = values(FIRST_MESSAGE_PERMISSIONS);

/** @param {"SINGLE"|"COUPLE"|""} profileType */
export function relationshipOptionsFor(profileType) {
  return RELATIONSHIP_STRUCTURES.filter((item) => item.for === "BOTH" || item.for === profileType);
}

/**
 * Validates the "who's here" step. For couples both adults must be 18+.
 * @param {{ profileType?: string, gender?: string, relationshipStatus?: string, partnerDisplayName?: string, partnerDateOfBirth?: string }} input
 * @param {Date} [today]
 * @returns {string | null} error message, or null when valid
 */
export function whoIsHereError(input, today = new Date()) {
  const { profileType, gender, relationshipStatus } = input;
  if (profileType !== "SINGLE" && profileType !== "COUPLE") return "Choose individual or couple.";
  if (!(profileType === "COUPLE" ? COUPLE : INDIVIDUAL).has(gender ?? "")) return "Choose who this profile is.";
  if (!relationshipOptionsFor(profileType).some((item) => item.value === relationshipStatus)) return "Choose how you relate.";
  if (profileType === "COUPLE") {
    const partnerName = (input.partnerDisplayName ?? "").trim();
    if (partnerName.length < 2 || partnerName.length > 80) return "Your partner's nickname must be between 2 and 80 characters.";
    const partnerAge = ageFromBirthDate(input.partnerDateOfBirth ?? "", today);
    if (partnerAge === null || partnerAge > 120) return "Enter your partner's date of birth.";
    if (partnerAge < 18) return "Everyone on a couple profile must be 18 or older.";
  }
  return null;
}

/** @param {unknown} list */
export function cleanLookingFor(list) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.filter((item) => typeof item === "string" && LOOKING.has(item)))];
}

/** @param {unknown} value */
export function cleanFirstMessagePermission(value) {
  return typeof value === "string" && MESSAGE.has(value) ? value : "MEMBERS_ONLY";
}
