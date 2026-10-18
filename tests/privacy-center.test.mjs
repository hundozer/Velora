import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const discreet = read("src/lib/discreet.ts");
const mode = read("src/components/privacy/DiscreetMode.tsx");
const layout = read("src/app/layout.tsx");
const settings = read("src/app/settings/page.tsx");
const css = read("src/app/globals.css");
const me = read("src/app/me/page.tsx");

test("discreet mode is device-local and survives blocked storage", () => {
  assert.match(discreet, /try \{ return window\.localStorage\.getItem\(DISCREET_STORAGE_KEY\) === "on"; \} catch \{ return false; \}/);
  assert.doesNotMatch(discreet, /fetch\(/);
});

test("discreet mode neutralises the title and blurs media until tapped", () => {
  assert.match(layout, /<DiscreetMode \/>/);
  assert.match(mode, /DISCREET_TITLE/);
  assert.match(mode, /media\.setAttribute\("data-revealed", "1"\)/);
  assert.match(css, /html\[data-discreet="on"\] main img:not\(\[data-revealed\]\)/);
});

test("Privacy Center gathers every control in one section reachable from Me", () => {
  assert.match(settings, /id="privacy"/);
  for (const control of ["Discreet mode on this device", "Browse invisibly", "Show activity", "Who can message you", "Your profile"]) assert.ok(settings.includes(control), control);
  assert.match(me, /href="\/settings#privacy"/);
});
