import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const read = (file) => readFile(new URL(`../${file}`, import.meta.url), "utf8");

test("report modal uses human, bilingual wording without a blanket manual review promise", async () => {
  const modal = await read("src/components/safety/ReportModal.tsx");
  const cs = JSON.parse(await read("src/locales/cs/phrases.json"));
  assert.match(modal, /t\("Tell us what happened"\)/);
  assert.match(modal, /t\("What's it mainly about\?"\)/);
  assert.match(modal, /t\("Send to our team"\)/);
  assert.match(modal, /t\("Someone might be under 18 \(urgent\)"\)/);
  assert.match(modal, /t\("Intimate content shared without consent \(urgent\)"\)/);
  assert.match(modal, /t\("Exploitation or trafficking \(urgent\)"\)/);
  assert.match(modal, /value="SUSPECTED_MINOR"/);
  assert.match(modal, /value="NON_CONSENSUAL_INTIMATE_CONTENT"/);
  assert.match(modal, /value="EXPLOITATION_TRAFFICKING"/);
  assert.doesNotMatch(modal, /A person reads every report/);
  for (const key of [
    "Tell us what happened", "What's it mainly about?", "Send to our team",
    "Someone might be under 18 (urgent)", "Your report didn't go through. Try again?",
  ]) assert.ok(cs[key], `Missing Czech translation: ${key}`);
});

test("beta dashboard points to real account, privacy and discovery routes", async () => {
  const dashboard = await read("src/app/dashboard/page.tsx");
  const cs = JSON.parse(await read("src/locales/cs/phrases.json"));
  assert.match(dashboard, /aria-labelledby="first-steps"/);
  assert.match(dashboard, /"\/verify-age"/);
  assert.match(dashboard, /"\/settings#privacy"/);
  assert.match(dashboard, /"\/people"/);
  assert.doesNotMatch(dashboard, /setTimeout|Math\.random/);
  for (const key of ["Your first days", "Make yourself at home", "Choose what you share", "Meet someone"])
    assert.ok(cs[key], `Missing Czech translation: ${key}`);
});
