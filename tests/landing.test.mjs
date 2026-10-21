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
  // Story structure: two journeys, four numbered chapters, privacy, one closing action.
  assert.match(home, /Meet someone,<br \/>or go out tonight\./);
  for (let index = 1; index <= 4; index += 1) assert.match(home, new RegExp(`<NumberedChapter index=\\{${index}\\} total=\\{4\\}`));
  for (const pillar of ["Say what you're into.", "Set your boundaries.", "Meet tonight, or whenever.", "Share privately.", "Discreet by design", "Prague Scene"]) assert.ok(home.includes(pillar), pillar);
  assert.match(home, /<ContextualCTA /);
  assert.doesNotMatch(home, /members online|total members|\{data\.pagination\.total\}/i);
  const layout = await read("src/app/layout.tsx");
  assert.match(layout, /title: "Intimo \| Prague's sex-positive community"/);
  assert.doesNotMatch(layout, /creator profiles|After Dark/);
});
