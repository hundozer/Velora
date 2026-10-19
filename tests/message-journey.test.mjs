import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { explicitPhotoRule, openersFor, planWindow } from "../src/lib/messageJourney.mjs";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("thread framing: plan window, explicit-photo rule, openers from shared context only", () => {
  assert.equal(planWindow({ startsAt: "2026-10-19T20:30:00Z", expiresAt: "2026-10-19T23:00:00Z" }), "22:30 until 01:00");
  assert.equal(planWindow({ expiresAt: "2026-10-19T23:00:00Z" }), "until 01:00");
  assert.equal(explicitPhotoRule("ASK_FIRST", false, "Lena"), "Explicit photographs stay off until Lena replies.");
  assert.equal(explicitPhotoRule("ASK_FIRST", true, "Lena"), "");
  assert.equal(explicitPhotoRule("NOT_INTERESTED", true, "Lena"), "Lena doesn't accept explicit photographs in chat.");
  assert.equal(explicitPhotoRule("COMFORTABLE", false, "Lena"), "");
  assert.equal(openersFor({ plan: { title: "Late jazz" }, shared: ["live jazz"] }).length, 2);
  assert.match(openersFor({ shared: ["live jazz"] })[0], /live jazz/);
  assert.ok(openersFor().length >= 1);
});

test("the chat keeps every server-side rule and only frames them", async () => {
  const chat = await read("src/components/chat/ChatWindow.tsx");
  assert.match(chat, /body: JSON\.stringify\(\{ receiverId: participantId, content: inputMessage\.trim\(\), datingAdId, mediaId \}\)/);
  assert.match(chat, /photoExplicit \? "EXPLICIT" : "NON_EXPLICIT"/);
  // Explicit is off until the boundary allows it; the server re-checks on send.
  assert.match(chat, /checked=\{photoExplicit && explicitAllowed\} disabled=\{!explicitAllowed\}/);
  assert.match(chat, /emptyThread && !openersHidden/);
  assert.match(chat, /If you&apos;d like a start/);
  assert.match(chat, /border-l-2 border-velora-copper/, "plan quote with a copper rule");
  assert.doesNotMatch(chat, /bg-gold-gradient|shadow-gold-glow|Amateri/);
  const page = await read("src/app/messages/page.tsx");
  assert.match(page, /useState<"list" \| "thread">\(targetUserId \? "thread" : "list"\)/);
});
