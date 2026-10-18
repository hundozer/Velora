import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFile(path.join(root, file), "utf8");

test("landing explains Intimo as Prague's private sex-positive network without counts", async () => {
  const home = await read("src/components/community/PublicCommunityHome.tsx");
  assert.match(home, /Prague · private · sex-positive/);
  assert.match(home, /How Intimo works/);
  for (const pillar of ["Desires & boundaries", "Tonight", "Private by design", "Prague Scene"]) assert.match(home, new RegExp(pillar));
  assert.doesNotMatch(home, /members online|total members|\{data\.pagination\.total\}/i);
  const layout = await read("src/app/layout.tsx");
  assert.match(layout, /title: "Intimo \| Prague's private, sex-positive network"/);
  assert.doesNotMatch(layout, /creator profiles|After Dark/);
});
