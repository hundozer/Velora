import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("member interior uses editorial design tokens and keeps the landing isolated", async () => {
  const css = await read("src/app/globals.css");
  assert.match(css, /\.intimo-member-heading/);
  assert.match(css, /Instrument Serif/);
  assert.match(css, /\.intimo-member-primary/);
  assert.match(css, /var\(--warm\)/);
  assert.match(css, /Scoped opt-in classes deliberately do not affect public landing/);
});

test("people, profile, messages, activity, connections and account use the same editorial shell", async () => {
  for (const path of [
    "src/components/people/MemberPeople.tsx",
    "src/components/profile/ProfileStory.tsx",
    "src/app/messages/page.tsx",
    "src/app/activity/page.tsx",
    "src/app/connections/page.tsx",
    "src/app/me/page.tsx",
  ]) {
    const source = await read(path);
    assert.match(source, /intimo-member-(page|heading|panel)/, path);
  }
});

test("member profile keeps consent-first interactions and messaging", async () => {
  const story = await read("src/components/profile/ProfileStory.tsx");
  assert.match(story, /friendAction\("REQUEST"\)/);
  assert.match(story, /toggleInterest/);
  assert.match(story, /toggleFavorite/);
  assert.match(story, /requestPhotos/);
  assert.match(story, /intimo-member-primary/);
});

test("secondary social surfaces use the same interior design", async () => {
  for (const path of [
    "src/app/dating/page.tsx",
    "src/app/rooms/page.tsx",
    "src/app/favorites/page.tsx",
    "src/app/notifications/page.tsx",
    "src/app/settings/page.tsx",
    "src/app/tonight/page.tsx",
  ]) {
    const src = await read(path);
    assert.match(src, /intimo-member-(page|heading|panel|primary)/, path);
  }
});
