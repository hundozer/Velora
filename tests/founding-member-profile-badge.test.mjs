import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Founding Member recognition comes from the server-stored membership level, not verification", () => {
  const profile = read("src/lib/supabase/publicProfile.ts");
  const publicProfile = read("src/lib/supabase/publicCommunity.ts");
  assert.match(profile, /foundingMember: row\.membership_level === "FOUNDING_MEMBER"/);
  assert.match(publicProfile, /foundingMember: row\.membership_level === "FOUNDING_MEMBER"/);
  assert.match(read("src/lib/discovery/context.ts"), /"membership_level"/);
  assert.match(read("src/app/api/public/profiles/[id]/route.ts"), /verification_level,membership_level/);
  assert.doesNotMatch(read("src/components/community/FoundingMemberBadge.tsx"), /BadgeCheck|Verified/);
});

test("profile pages and both discovery views display the same compact badge", () => {
  for (const path of [
    "src/components/profile/ProfileStory.tsx",
    "src/components/people/PersonTile.tsx",
    "src/components/people/PeopleIndex.tsx",
    "src/components/people/IntroductionSpread.tsx",
  ]) {
    const source = read(path);
    assert.match(source, /<FoundingMemberBadge/);
    assert.match(source, /foundingMember/);
  }
  const cs = JSON.parse(read("src/locales/cs/phrases.json"));
  assert.equal(cs["Founding Member"], "Zakládající člen");
});
