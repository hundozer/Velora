import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("beta welcome is on member dashboard, with four live actions and a feedback destination", async () => {
  const dashboard = await read("src/app/dashboard/page.tsx");
  const welcome = await read("src/components/community/BetaWelcome.tsx");
  assert.match(dashboard, /<BetaWelcome \/>/);
  for (const link of ["/verify-age", "/me", "/settings", "/people"]) assert.ok(welcome.includes(`href: "${link}"`));
  assert.match(welcome, /mailto:contact@intimo.live\?subject=Intimo%20beta%20feedback/);
  assert.match(welcome, /TASKS\.map/);
});

test("revised member copy retains server moderation reason codes and verified retention notice", async () => {
  const modal = await read("src/components/safety/ReportModal.tsx");
  const age = await read("src/app/verify-age/page.tsx");
  for (const code of ["SUSPECTED_MINOR", "NON_CONSENSUAL_INTIMATE_CONTENT", "EXPLOITATION_TRAFFICKING"]) assert.ok(modal.includes(code));
  assert.match(modal, /Tell us what happened/);
  assert.match(age, /You're in\. Welcome to Intimo/);
  assert.match(age, /A legal hold may require longer retention/);
  assert.doesNotMatch(age, /deleted automatically after the check/);
});

test("all new member-facing English keys have Czech translations", async () => {
  const cs = JSON.parse(await read("src/locales/cs/phrases.json"));
  for (const key of ["Tell us what happened", "Someone might be under 18 (urgent)", "You're in. Welcome to Intimo.", "Make yourself at home. Then tell us what feels off.", "Send beta feedback"]) {
    assert.equal(typeof cs[key], "string");
    assert.ok(cs[key].trim().length);
  }
});
