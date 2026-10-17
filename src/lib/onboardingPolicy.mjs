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
