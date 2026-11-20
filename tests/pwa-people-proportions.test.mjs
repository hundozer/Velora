import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("people header and Stories are in separate mobile rows", () => {
  const page = read("src/components/people/MemberPeople.tsx");
  assert.match(page, /<header className=\{\`relative z-20/);
  assert.match(page, /min-h-\[64px\]/);
  assert.match(page, /items-center justify-between gap-3/);
  assert.doesNotMatch(page, /absolute inset-x-0 top-0 md:static/);
  assert.match(page, /relative z-10 mx-auto max-w-2xl/);
  assert.doesNotMatch(page, /relative z-20 mt-16/);
  assert.match(page, /Stories · see what people are sharing/);
  assert.match(page, /bg-velora-night text-velora-onPhoto/);
});

test("mobile introduction is shorter than the full viewport and text fits narrow screens", () => {
  const spread = read("src/components/people/IntroductionSpread.tsx");
  assert.match(spread, /min-h-\[clamp\(440px,68svh,680px\)\]/);
  assert.doesNotMatch(spread, /min-h-\[calc\(100svh-4rem/);
  assert.match(spread, /text-\[clamp\(3\.25rem,15vw,5\.75rem\)\]/);
  assert.match(spread, /md:text-\[clamp\(4\.5rem,8vw,7rem\)\]/);
  assert.match(spread, /px-5 pb-7 pt-12/);
  assert.match(spread, /md:pt-28/);
  assert.match(spread, /min-h-11/);
});

test("desktop introduction cards keep their existing height and typography", () => {
  const spread = read("src/components/people/IntroductionSpread.tsx");
  assert.match(spread, /md:min-h-\[min\(82vh,760px\)\]/);
  assert.match(spread, /md:rounded-\[28px\]/);
  assert.match(spread, /md:pb-14 md:pl-14/);
});
