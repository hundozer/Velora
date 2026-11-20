import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (name) => readFileSync(new URL("../" + name, import.meta.url), "utf8");

test("authenticated member feed exposes equal Connect, Belong and Express pathways", () => {
  const home = read("src/components/community/MemberActivityFeed.tsx");
  const pathways = read("src/components/community/SocialPathways.tsx");
  assert.match(home, /import \{ SocialPathways \} from "\.\/SocialPathways"/);
  assert.match(home, /<SocialPathways \/>/);
  for (const href of ["/connections", "/rooms", "/albums"]) {
    assert.ok(pathways.includes(`href: "${href}"`), `missing ${href} pathway`);
  }
  for (const pillar of ["01 / Connect", "02 / Belong", "03 / Express"]) {
    assert.ok(pathways.includes(pillar), `missing ${pillar}`);
  }
});

test("social pathways are links only and leave server-side access checks unchanged", () => {
  const pathways = read("src/components/community/SocialPathways.tsx");
  assert.doesNotMatch(pathways, /fetch\(|supabase|privatePhoto|grantAccess|localStorage/);
  assert.match(pathways, /aria-labelledby="social-pathways-heading"/);
  assert.match(pathways, /focus-visible:outline/);
  assert.match(pathways, /grid gap-3 sm:grid-cols-3/);
});
