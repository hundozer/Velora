import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFile(path.join(root, file), "utf8");

test("landing explains Intimo as Prague's sex-positive community without counts", async () => {
  const home = await read("src/components/community/PublicCommunityHome.tsx");
  assert.match(home, /Prague · Sex-positive · 18\+/);
  for (const pillar of ["Looking for someone?", "What brings you here?", "Just chemistry.", "Something kinky.", "Explore together.", "Join the founding members", "Create your profile", "Prague Scene"]) assert.ok(home.includes(pillar), pillar);
  assert.match(home, /fictional examples, not members/);
  assert.doesNotMatch(home, /Example profile<\/span>/);
  assert.match(home, /if \(user\) return <MemberActivityFeed \/>/);
  assert.doesNotMatch(home, /fetch\(|\/profile\/|recentlyActive|BadgeCheck/);
  assert.doesNotMatch(home, /members online|total members|\{data\.pagination\.total\}/i);
  const layout = await read("src/app/layout.tsx");
  assert.match(layout, /title: "Intimo \| Prague's sex-positive community"/);
  assert.doesNotMatch(layout, /creator profiles|After Dark/);
});
