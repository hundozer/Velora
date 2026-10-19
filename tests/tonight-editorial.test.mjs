import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { byHour, clock, glanceTime, groupTonight, nightKey, openingLine, shortAudience, untilWords, windowFromClock } from "../src/lib/tonight.mjs";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const now = new Date("2026-10-19T19:05:00Z"); // 21:05 in Prague
const P = (start, end, extra = {}) => ({ startsAt: start, expiresAt: end, ...extra });

test("plans fall into now, later tonight and tomorrow, in start order, in Prague time", () => {
  const plans = [
    P("2026-10-20T17:00:00Z", "2026-10-20T21:00:00Z", { id: "tomorrow" }),
    P("2026-10-19T23:30:00Z", "2026-10-20T01:00:00Z", { id: "01:30" }),
    P("2026-10-19T20:30:00Z", "2026-10-19T23:00:00Z", { id: "22:30" }),
    P("2026-10-19T19:00:00Z", "2026-10-19T21:30:00Z", { id: "now" }),
    P("2026-10-19T15:00:00Z", "2026-10-19T19:00:00Z", { id: "ended" }),
  ];
  const groups = groupTonight(plans, now);
  assert.deepEqual(groups.happening.map((p) => p.id), ["now"]);
  assert.deepEqual(groups.later.map((p) => p.id), ["22:30", "01:30"], "a plan after midnight is still tonight");
  assert.deepEqual(groups.tomorrow.map((p) => p.id), ["tomorrow"]);
  assert.equal(glanceTime(groups.happening[0], now), "Now");
  assert.equal(glanceTime(groups.later[0], now), "22:30");
  assert.equal(glanceTime(groups.tomorrow[0], now), "Tue 19:00");
  assert.deepEqual(byHour(groups.later).map((b) => b.hour), [22, 1]);
  assert.equal(openingLine(now), "Prague, tonight · 21:05");
  assert.equal(clock("2026-10-19T22:00:00Z"), "00:00");
  assert.equal(nightKey("2026-10-20T02:00:00Z"), nightKey(now), "04:00 belongs to the same night");
});

test("the sentence form turns a day and two clock times into a valid window", () => {
  const local = new Date(2026, 9, 19, 21, 5);
  const w = windowFromClock({ day: "tonight", from: "21:30", until: "00:30" }, local);
  assert.equal((new Date(w.endsAt) - new Date(w.startsAt)) / 3_600_000, 3, "an end before the start runs past midnight");
  const t = windowFromClock({ day: "tomorrow", from: "19:00", until: "23:00" }, local);
  assert.equal(new Date(t.startsAt).getDate(), 20);
  const late = windowFromClock({ day: "tonight", from: "23:00", until: "02:00" }, new Date(2026, 9, 20, 0, 30));
  assert.equal(new Date(late.startsAt).getDate(), 19, "after midnight, 'tonight' still means the night we're in");
  assert.equal(windowFromClock({ day: "tonight", from: "", until: "" }, local), null);
  assert.equal(untilWords("00:00"), "midnight");
  assert.equal(shortAudience("women and couples"), "Women & couples only");
  assert.equal(shortAudience("everyone"), "Open to everyone");
});

test("Tonight shows every plan's times, place and reply eligibility from the server", async () => {
  const page = await read("src/app/tonight/page.tsx");
  assert.match(page, /groupTonight\(/);
  assert.match(page, /plan\.canReply/, "Reply only when the server says you can");
  assert.match(page, /plan\.eligibilityText/);
  assert.match(page, /until \{clock\(plan\.expiresAt\)\}/);
  assert.match(page, /Happening now · since/);
  assert.match(page, /Later tonight/);
  assert.match(page, /contentType="POST"/);
  assert.doesNotMatch(page, /rounded-full border px-3 text-xs|PLAN_CATEGORIES/, "no category pills");
  const create = await read("src/app/tonight/new/page.tsx");
  assert.match(create, /I&apos;d like to/);
  assert.match(create, /I&apos;d welcome/);
  assert.match(create, /Only the neighbourhood is shown/);
  assert.match(create, /startsAt: slot\.startsAt, endsAt: slot\.endsAt/);
  assert.match(create, /Invitations last up to 12 hours/);
  const messages = await read("src/app/api/messages/route.ts");
  assert.match(messages, /planReplyEligibility\(/, "replying stays enforced on the server");
});
