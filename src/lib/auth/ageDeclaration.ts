import { createHmac, timingSafeEqual } from "node:crypto";

export const AGE_DECLARATION_COOKIE = "intimo_age_declaration";
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

function secret() {
  const value = process.env.AUTH0_SECRET;
  if (!value || value.length < 32) return null;
  return value;
}

function signature(timestamp: string, signingSecret: string) {
  return createHmac("sha256", signingSecret).update(`intimo-age-v1:${timestamp}`).digest("base64url");
}

export function createAgeDeclarationValue(now = Date.now()) {
  const signingSecret = secret();
  if (!signingSecret) return null;
  const timestamp = Math.floor(now / 1000).toString();
  return `${timestamp}.${signature(timestamp, signingSecret)}`;
}

export function verifyAgeDeclarationValue(value: string | undefined, now = Date.now()) {
  const signingSecret = secret();
  if (!signingSecret || !value) return false;
  const [timestamp, suppliedSignature, extra] = value.split(".");
  if (!timestamp || !suppliedSignature || extra) return false;
  const declaredAt = Number(timestamp);
  const current = Math.floor(now / 1000);
  if (!Number.isInteger(declaredAt) || declaredAt > current + 60 || current - declaredAt > MAX_AGE_SECONDS) return false;
  const expected = Buffer.from(signature(timestamp, signingSecret));
  const supplied = Buffer.from(suppliedSignature);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

export const AGE_DECLARATION_MAX_AGE = MAX_AGE_SECONDS;
