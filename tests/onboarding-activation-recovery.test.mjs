import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL("../"+p, import.meta.url), "utf8");

test("onboarding keeps invitation-bound server creation and does not silently treat conflicts as success", () => {
  const wizard = read("src/app/onboarding/page.tsx");
  const api = read("src/app/api/profile/me/route.ts");
  assert.match(wizard, /inviteToken,/);
  assert.match(wizard, /response.status === 409 && payload.error === "Profile already exists"/);
  assert.match(wizard, /fetch\("\/api\/profile\/me", \{ credentials: "same-origin", cache: "no-store" \}\)/);
  assert.match(wizard, /if \(!current.ok\) throw new Error/);
  assert.match(wizard, /if \(!response.ok\) throw new Error/);
  assert.match(api, /is_member_invite_valid/);
  assert.match(api, /redeem_member_invite/);
});

test("one pending area submit cannot create multiple profiles and errors remain visible", () => {
  const wizard = read("src/app/onboarding/page.tsx");
  assert.match(wizard, /if \(submittingRef.current\) return/);
  assert.match(wizard, /submittingRef.current = true/);
  assert.match(wizard, /submittingRef.current = false/);
  assert.match(wizard, /disabled=\{!areaId \|\| submitting\}/);
  assert.match(wizard, /onClick=\{\(\) => void createProfile\(areaId\)\}/);
  assert.match(wizard, /setAreaGroup\(value\); setAreaId\(""\)/);
  assert.match(wizard, /area.kind === "PRAGUE_DISTRICT"/);
  assert.match(wizard, /\{errorLine\}/);
  assert.doesNotMatch(wizard, /\{t\(errorLine\)\}/);
  assert.match(wizard, /window.location.replace\("\/verify-age"\)/);
});

test("first steps use actual account progress and offer rooms without fabricating a milestone", () => {
  const steps = read("src/components/community/NewMemberFirstSteps.tsx");
  const api = read("src/app/api/member/activation/route.ts");
  assert.match(steps, /<Link href="\/rooms"/);
  assert.match(steps, /Not ready to message someone\? Start with a public room\./);
  assert.match(steps, /data.hasPhoto && data.hasPreferences && data.firstContactMade/);
  assert.match(api, /direct_messages/);
  assert.match(api, /interests/);
  assert.doesNotMatch(api, /page_views|room_visit/);
});

test("translation covers onboarding recovery and optional community invitation", () => {
  const cs=JSON.parse(read("src/locales/cs/phrases.json"));
  for(const k of [
    "We couldn't confirm your existing profile. Try again.",
    "Not ready to message someone? Start with a public room."
  ]) assert.ok(cs[k],k);
});
