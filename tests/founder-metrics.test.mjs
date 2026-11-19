import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { founderMetrics, isCountedMember, metricsSummary, weekStart } from "../src/lib/admin/founderMetrics.mjs";

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), "utf8");
const NOW = Date.parse("2026-11-18T12:00:00Z"); // a Wednesday
const daysAgo = (n) => new Date(NOW - n * 86_400_000).toISOString();
const member = (extra) => ({ account_status: "ACTIVE", account_lifecycle_status: "ACTIVE", is_demo: false, created_at: daysAgo(20), ...extra });

const rows = {
  profiles: [
    member({ gender: "FEMALE", verification_status: "VERIFIED", created_at: daysAgo(2), last_active_at: daysAgo(1), membership_level: "FOUNDING_MEMBER" }),
    member({ gender: "MALE", last_active_at: daysAgo(10) }),
    member({ gender: "MALE", is_couple_profile: true, verification_status: "IDENTITY_VERIFIED" }),
    member({ gender: "NON_BINARY" }),
    member({ gender: null }),
    member({ gender: "FEMALE", is_demo: true }), // staging demo: never counted
    member({ gender: "MALE", account_status: "SUSPENDED" }), // restricted: not a member
    member({ gender: "MALE", account_lifecycle_status: "DELETED" }),
  ],
  requests: [
    { identity: "WOMAN", status: "PENDING", created_at: daysAgo(1) },
    { identity: "MAN", status: "APPROVED", created_at: daysAgo(9) },
    { identity: "COUPLE", status: "REJECTED", created_at: daysAgo(30) },
  ],
  invites: [
    { status: "REDEEMED", created_at: daysAgo(9), sent_at: daysAgo(9), redeemed_at: daysAgo(2), expires_at: daysAgo(-21) },
    { status: "SENT", created_at: daysAgo(3), sent_at: daysAgo(3), expires_at: daysAgo(-27) },
    { status: "SENT", created_at: daysAgo(40), sent_at: daysAgo(40), expires_at: daysAgo(10) },
    { status: "FAILED", created_at: daysAgo(3) },
  ],
  reports: [{ created_at: daysAgo(1) }, { created_at: daysAgo(45) }],
  codes: [{source_label:"Carolinka test group",uses:2},{source_label:"Party partner: X",uses:3}],
};

test("counts only active, non-demo, non-deleted members", () => {
  assert.equal(rows.profiles.filter(isCountedMember).length, 5);
});

test("founding numbers are aggregate counts with the agreed definitions", () => {
  const m = founderMetrics(rows, NOW);
  assert.deepEqual(m.members, { total: 5, newLast7Days: 1, activeLast7Days: 1, verified: 2, verifiedPct: 40, foundingMembers: 1 });
  assert.deepEqual(m.mix.women, { count: 1, pct: 20 });
  assert.deepEqual(m.mix.men, { count: 1, pct: 20 });
  assert.deepEqual(m.mix.couples, { count: 1, pct: 20 }); // a couple counts as a couple, whatever its gender field
  assert.equal(m.mix.nonBinaryOrOther.count, 1);
  assert.equal(m.mix.notStated.count, 1);
  assert.deepEqual(m.invitationRequests, { pending: 1, approved: 1, rejected: 1, total: 3, mix: { women: 1, men: 1, couples: 1, nonBinaryOrOther: 0 } });
  // Sent = provider accepted (SENT or REDEEMED); FAILED is not sent. Joined = redeemed.
  assert.deepEqual(m.invitations, { sent: 3, joined: 1, waiting: 1, expired: 1, acceptancePct: 33.3 });
  assert.deepEqual(m.invitationCodeSources, [{source:"Party partner: X",signups:3},{source:"Carolinka test group",signups:2}]);
  assert.deepEqual(m.reports, { last30Days: 1, per100Members: 20 });
});

test("weekly rows run Monday to Monday and end with the current week", () => {
  const m = founderMetrics(rows, NOW, 8);
  assert.equal(m.weekly.length, 8);
  assert.equal(m.weekly.at(-1).weekStart, "2026-11-16");
  assert.equal(new Date(weekStart(NOW)).getUTCDay(), 1);
  const current = m.weekly.at(-1);
  assert.deepEqual(current, { weekStart: "2026-11-16", newMembers: 1, invitationRequests: 1, invitationsSent: 0, invitationsAccepted: 1, reports: 1 });
  // Sent three days ago is Sunday 15 November: the previous week, not this one.
  assert.equal(m.weekly.at(-2).invitationsSent, 2); // Mon 9 Nov and Sun 15 Nov
});

test("empty data gives zeros and no fake percentages", () => {
  const m = founderMetrics({ profiles: [], requests: [], invites: [], reports: [] }, NOW);
  assert.equal(m.members.total, 0);
  assert.equal(m.members.verifiedPct, null);
  assert.equal(m.invitations.acceptancePct, null);
  assert.equal(m.reports.per100Members, null);
  assert.match(metricsSummary(m), /Members: 0/);
});

test("the summary carries totals only, no member details", () => {
  const text = metricsSummary(founderMetrics(rows, NOW));
  assert.match(text, /Members: 5 \(1 new this week, 1 active this week\)/);
  assert.match(text, /Reports \(last 30 days\): 1 \(20 per 100 members\)/);
  assert.doesNotMatch(text, /@|[0-9a-f]{8}-[0-9a-f]{4}/);
});

test("the numbers API is admin-only, MFA-gated and returns aggregates", async () => {
  const route = await read("src/app/api/admin/metrics/route.ts");
  assert.match(route, /requireAdminPermission\(req, "users:view_sensitive"\)/);
  assert.match(route, /Cache-Control": "private, no-store"/);
  // Only aggregate fields leave the server: no ids, emails or names are selected.
  const columns = [...route.matchAll(/readAll\(db, "[a-z_]+", "([^"]+)"/g)].map((match) => match[1]);
  assert.equal(columns.length, 5);
  for (const list of columns) assert.doesNotMatch(list, /\bid\b|email|display_name|username/);
  // PostgREST caps each response at 1,000 rows: read in pages and detect truncation from the exact count.
  assert.match(route, /const PAGE = 1_000/);
  assert.match(route, /\.range\(from, from \+ PAGE - 1\)/);
  assert.match(route, /count: from === 0 \? "exact"/);
  assert.match(route, /truncated: total !== null \? total > rows\.length/);
  assert.match(route, /NextResponse\.json\(\{ metrics, truncated \}/);
  const center = await read("src/components/admin/AdminCommandCenter.tsx");
  assert.match(center, /pathname\.startsWith\("\/admin\/numbers"\)\) \{ title = "Numbers"; if \(can\("users:view_sensitive"\)\)/);
});
