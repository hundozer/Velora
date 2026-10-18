import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ESTABLISHED_MIN_DAYS, TRUST_SIGNALS, trustSignals } from "../src/lib/trust.mjs";

const now = new Date("2026-10-18T12:00:00Z");
const daysAgo = (days) => new Date(now.getTime() - days * 86_400_000).toISOString();

test("photo verified only for moderator-approved verification", () => {
  assert.deepEqual(trustSignals({ verificationStatus: "VERIFIED" }, now), ["PHOTO_VERIFIED"]);
  assert.deepEqual(trustSignals({ verificationStatus: "PENDING" }, now), []);
});

test("established needs age, a photo and an unrestricted account", () => {
  const base = { createdAt: daysAgo(ESTABLISHED_MIN_DAYS + 1), hasAvatar: true, accountStatus: "ACTIVE" };
  assert.deepEqual(trustSignals(base, now), ["ESTABLISHED"]);
  assert.deepEqual(trustSignals({ ...base, createdAt: daysAgo(ESTABLISHED_MIN_DAYS - 1) }, now), []);
  assert.deepEqual(trustSignals({ ...base, hasAvatar: false }, now), []);
  assert.deepEqual(trustSignals({ ...base, accountStatus: "SUSPENDED" }, now), []);
  assert.deepEqual(trustSignals({ ...base, createdAt: null }, now), []);
});

test("signals are plain facts, never a score", () => {
  assert.deepEqual(Object.keys(TRUST_SIGNALS).sort(), ["ESTABLISHED", "PHOTO_VERIFIED"]);
  const source = readFileSync(new URL("../src/lib/trust.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /score\s*[:=]|points/i);
  const mapper = readFileSync(new URL("../src/lib/supabase/publicProfile.ts", import.meta.url), "utf8");
  assert.match(mapper, /trustSignals: trustSignals\(\{ verificationStatus: row\.verification_status/);
});
