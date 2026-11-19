// FM-07: reports get an outcome, decisions a statement of reasons, and either side can appeal.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import * as outcomes from "../src/lib/moderation/outcomes.mjs";
import * as identity from "../src/lib/identity.mjs";
import { normalizeWork, sortWork } from "../src/lib/admin/workspace.mjs";

const { dueAt, isOverdue, cleanDecision, mayAppeal, affectedMemberMaySee, reporterState, reporterNotice, appealNotice, AFFECTED_NOTICE } = outcomes;
const require = createRequire(import.meta.url);
const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
function load(file, mocks) {
  const code = ts.transpileModule(read(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)((name) => (name in mocks ? mocks[name] : require(name)), module, module.exports);
  return module.exports;
}
const CASE = "12345678-1234-4123-8123-123456789012";
const REPORTER = "22345678-1234-4123-8123-123456789012";
const REPORTED = "32345678-1234-4123-8123-123456789012";
const ADMIN = "42345678-1234-4123-8123-123456789012";

test("urgent reports are due within an hour, everything else within twelve", () => {
  const created = "2026-11-18T10:00:00.000Z";
  assert.equal(dueAt({ created_at: created, priority: "CRITICAL" }), "2026-11-18T11:00:00.000Z");
  assert.equal(dueAt({ created_at: created, priority: "HIGH" }), "2026-11-18T22:00:00.000Z");
  assert.equal(dueAt({ created_at: created, priority: "STANDARD" }), "2026-11-18T22:00:00.000Z");
  const later = Date.parse("2026-11-18T11:30:00Z");
  assert.equal(isOverdue({ created_at: created, priority: "CRITICAL", status: "ESCALATED" }, later), true);
  assert.equal(isOverdue({ created_at: created, priority: "STANDARD", status: "OPEN" }, later), false);
  assert.equal(isOverdue({ created_at: created, priority: "CRITICAL", status: "RESOLVED" }, later), false, "a decided case is never overdue");
});

test("action needs what was done, the guideline and an explanation; no breach needs none", () => {
  assert.deepEqual(cleanDecision("REJECTED", { actionTaken: "ACCOUNT_BANNED" }).value, { action_taken: "NO_ACTION", policy_ground: null, member_statement: null });
  assert.equal(cleanDecision("RESOLVED", {}).error, "Choose the action that was taken");
  assert.equal(cleanDecision("RESOLVED", { actionTaken: "NO_ACTION" }).error, "Choose the action that was taken");
  assert.equal(cleanDecision("RESOLVED", { actionTaken: "WARNING", policyGround: "MADE_UP" }).error, "Choose the guideline the decision relies on");
  assert.match(cleanDecision("RESOLVED", { actionTaken: "WARNING", policyGround: "HARASSMENT", memberStatement: "too short" }).error, /20 characters/);
  assert.deepEqual(cleanDecision("RESOLVED", { actionTaken: "WARNING", policyGround: "HARASSMENT", memberStatement: "  You sent  repeated messages after being asked to stop. " }).value,
    { action_taken: "WARNING", policy_ground: "HARASSMENT", member_statement: "You sent repeated messages after being asked to stop." });
  assert.deepEqual(cleanDecision("UNDER_REVIEW", {}).value, {});
});

test("the reported member sees only decided actions; either side may appeal once", () => {
  const acted = { status: "RESOLVED", action_taken: "WARNING", appeal_status: "NONE", reporter_id: REPORTER, reported_user_id: REPORTED };
  const dismissed = { ...acted, status: "REJECTED", action_taken: "NO_ACTION" };
  assert.equal(affectedMemberMaySee(acted), true);
  assert.equal(affectedMemberMaySee(dismissed), false, "a dismissed report is never shown to the reported member");
  assert.equal(affectedMemberMaySee({ ...acted, status: "OPEN", action_taken: null }), false, "nor an open one");
  assert.equal(affectedMemberMaySee({ ...acted, status: "APPEALED", appeal_status: "OPEN" }), true);
  assert.equal(mayAppeal(acted, REPORTED), true);
  assert.equal(mayAppeal(dismissed, REPORTED), false);
  assert.equal(mayAppeal(dismissed, REPORTER), true, "the reporter can contest a no-breach decision (DSA Art. 20)");
  assert.equal(mayAppeal(acted, REPORTER), true);
  assert.equal(mayAppeal({ ...acted, appeal_status: "UPHELD" }, REPORTED), false, "one appeal per case");
  assert.equal(mayAppeal(acted, ADMIN), false);
  assert.equal(reporterState(acted), "ACTION_TAKEN");
  assert.equal(reporterState(dismissed), "NO_BREACH");
  assert.equal(reporterState({ status: "ESCALATED" }), "IN_REVIEW");
  assert.match(reporterNotice("RESOLVED").message, /don't share what happened to the other member/);
  assert.equal(reporterNotice("UNDER_REVIEW"), null);
  assert.match(AFFECTED_NOTICE.message, /how to appeal/);
  assert.equal(appealNotice("NOPE"), null);
});

/** A recording fake database: `results` maps "table:op" to what the query resolves to. */
function fakeDb(results = {}) {
  const calls = [];
  const db = {
    from(table) {
      const call = { table, op: "select", values: null, filters: [] }; calls.push(call);
      const q = {
        select() { return q; }, maybeSingle() { return q; }, single() { return q; }, order() { return q; }, limit() { return q; },
        insert(values) { call.op = "insert"; call.values = values; return q; },
        update(values) { call.op = "update"; call.values = values; return q; },
        eq(column, value) { call.filters.push(["eq", column, value]); return q; },
        in(column, value) { call.filters.push(["in", column, value]); return q; },
        or(value) { call.filters.push(["or", value]); return q; },
        then(resolve) { const result = results[`${table}:${call.op}`]; resolve(typeof result === "function" ? result(call) : (result || { data: null, error: null })); },
      };
      return q;
    },
    rpc(name, args) { calls.push({ rpc: name, args }); return Promise.resolve(results[`rpc:${name}`] || { data: null, error: null }); },
  };
  return { db, calls };
}
const adminMocks = (db, critical = true) => ({
  "@/lib/auth/adminApi": {
    requireAdminPermission: async (_req, permission) => permission === "moderation:critical" && !critical ? { response: new Response(null, { status: 403 }) } : { actor: { profileId: ADMIN, role: "SUPER_ADMIN" } },
    requestSecurityMetadata: () => ({}),
  },
  "@/lib/supabase/server": { getServerSupabase: () => db },
  "@/lib/identity.mjs": identity,
  "@/lib/moderation/outcomes.mjs": outcomes,
});
const patch = (body) => ({ json: async () => body, nextUrl: new URL("https://example.test/api/admin/moderation"), headers: new Headers() });
const openCase = { id: CASE, status: "UNDER_REVIEW", priority: "STANDARD", reporter_id: REPORTER, reported_user_id: REPORTED };

test("a decision with action notifies both members and records the statement of reasons", async () => {
  const { db, calls } = fakeDb({
    "moderation_cases:select": { data: openCase, error: null },
    "moderation_cases:update": (call) => ({ data: { id: CASE, ...call.values }, error: null }),
  });
  const route = load("src/app/api/admin/moderation/route.ts", adminMocks(db));
  const response = await route.PATCH(patch({ id: CASE, status: "RESOLVED", decision: "WARNING", decisionReason: "Checked the messages.", actionTaken: "WARNING", policyGround: "HARASSMENT", memberStatement: "You kept messaging after being asked to stop." }));
  assert.equal(response.status, 200);
  const update = calls.find((call) => call.table === "moderation_cases" && call.op === "update");
  assert.equal(update.values.action_taken, "WARNING");
  assert.equal(update.values.member_statement, "You kept messaging after being asked to stop.");
  assert.ok(update.filters.some((f) => f[1] === "status" && f[2] === "UNDER_REVIEW"), "only one admin's decision wins");
  const notices = calls.find((call) => call.table === "notifications").values;
  assert.deepEqual(notices.map((row) => [row.user_id, row.type]), [[REPORTER, "REPORT_OUTCOME"], [REPORTED, "MODERATION_DECISION"]]);
  assert.doesNotMatch(JSON.stringify(notices), /Checked the messages|kept messaging/, "notices never carry the internal note or details");
});

test("no breach tells only the reporter; appealed or decided cases can't be re-decided here", async () => {
  let fake = fakeDb({ "moderation_cases:select": { data: openCase, error: null }, "moderation_cases:update": (call) => ({ data: { id: CASE, ...call.values }, error: null }) });
  let route = load("src/app/api/admin/moderation/route.ts", adminMocks(fake.db));
  assert.equal((await route.PATCH(patch({ id: CASE, status: "REJECTED", decision: "NO_ACTION", decisionReason: "Nothing found in the photo." }))).status, 200);
  assert.deepEqual(fake.calls.find((call) => call.table === "notifications").values.map((row) => row.user_id), [REPORTER]);

  fake = fakeDb({ "moderation_cases:select": { data: openCase, error: null } });
  route = load("src/app/api/admin/moderation/route.ts", adminMocks(fake.db));
  const missing = await route.PATCH(patch({ id: CASE, status: "RESOLVED", decision: "WARNING", decisionReason: "Checked.", actionTaken: "WARNING", policyGround: "HARASSMENT" }));
  assert.equal(missing.status, 400, "action without an explanation for the member is refused");

  for (const status of ["APPEALED", "RESOLVED"]) {
    fake = fakeDb({ "moderation_cases:select": { data: { ...openCase, status }, error: null } });
    route = load("src/app/api/admin/moderation/route.ts", adminMocks(fake.db));
    const response = await route.PATCH(patch({ id: CASE, status: "REJECTED", decision: "NO_ACTION", decisionReason: "Second look." }));
    assert.equal(response.status, 409, status);
    assert.equal(fake.calls.some((call) => call.op === "update"), false);
  }
});

test("appeals are decided in one transaction, the appellant is told, and a same-person review is recorded", async () => {
  const { db, calls } = fakeDb({
    "moderation_cases:select": { data: { id: CASE, status: "APPEALED", priority: "STANDARD", assigned_moderator: ADMIN }, error: null },
    "rpc:intimo_decide_appeal": { data: { appeal_id: "a", appellant_id: REPORTED, outcome: "OVERTURNED", case_status: "RESOLVED" }, error: null },
  });
  const route = load("src/app/api/admin/moderation/appeals/route.ts", adminMocks(db));
  const response = await route.PATCH(patch({ caseId: CASE, outcome: "OVERTURNED", memberStatement: "The messages were mutual; we lifted the warning.", internalReason: "Re-read the whole thread." }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).sameReviewer, true);
  const rpc = calls.find((call) => call.rpc === "intimo_decide_appeal");
  assert.deepEqual(rpc.args, { p_case_id: CASE, p_reviewer_id: ADMIN, p_outcome: "OVERTURNED", p_member_statement: "The messages were mutual; we lifted the warning.", p_internal_reason: "Re-read the whole thread." });
  const audit = calls.find((call) => call.table === "admin_action_events").values;
  assert.equal(audit.new_state.sameReviewerAsDecision, true);
  const notice = calls.find((call) => call.table === "notifications").values;
  assert.equal(notice.user_id, REPORTED);
  assert.equal(notice.type, "APPEAL_OUTCOME");
  // Critical cases still need the critical permission.
  const critical = fakeDb({ "moderation_cases:select": { data: { id: CASE, status: "APPEALED", priority: "CRITICAL" }, error: null } });
  const denied = load("src/app/api/admin/moderation/appeals/route.ts", adminMocks(critical.db, false));
  assert.equal((await denied.PATCH(patch({ caseId: CASE, outcome: "UPHELD", memberStatement: "We looked again and it stays.", internalReason: "Checked again." }))).status, 403);
  assert.equal(critical.calls.some((call) => call.rpc), false);
});

test("members see their reports' outcome and decisions about them, never open reports or the reporter", async () => {
  const rows = [
    { id: "r1", reporter_id: REPORTER, reported_user_id: REPORTED, content_type: "MESSAGE", reason: "HARASSMENT", status: "RESOLVED", appeal_status: "NONE", action_taken: "WARNING", policy_ground: "HARASSMENT", member_statement: "Repeated unwanted messages.", decision_timestamp: "2026-11-18T12:00:00Z", created_at: "2026-11-18T10:00:00Z" },
    { id: "r2", reporter_id: "other", reported_user_id: REPORTED, content_type: "PHOTO", reason: "SPAM", status: "OPEN", appeal_status: "NONE", action_taken: null, created_at: "2026-11-18T11:00:00Z" },
    { id: "r3", reporter_id: "other", reported_user_id: REPORTED, content_type: "PROFILE", reason: "IMPERSONATION", status: "REJECTED", appeal_status: "NONE", action_taken: "NO_ACTION", created_at: "2026-11-18T09:00:00Z" },
  ];
  const as = async (me) => {
    const { db } = fakeDb({ "moderation_cases:select": { data: rows, error: null }, "moderation_appeals:select": { data: [], error: null } });
    const route = load("src/app/api/reports/route.ts", {
      "@/lib/auth/serverActor": { resolveServerActor: async () => ({ status: "authenticated", actor: { profileId: me, userId: me } }), hasAdultAccess: () => true },
      "@/lib/supabase/server": { getServerSupabase: () => db },
      "@/lib/security/rateLimiter": { checkRateLimit: async () => ({ allowed: true }) },
      "@/lib/auth/auditLogger": { auditLogger: { logEvent() {} } },
      "@/lib/notifications/safetyAlert": { notifySafetyTeam: async () => true },
      "@/lib/identity.mjs": identity, "@/lib/moderation/outcomes.mjs": outcomes,
    });
    return (await route.GET({ nextUrl: new URL("https://example.test/api/reports"), headers: new Headers() })).json();
  };
  const reported = await as(REPORTED);
  assert.deepEqual(reported.decisions.map((row) => row.id), ["r1"], "open and dismissed reports stay hidden");
  assert.equal(reported.decisions[0].statement, "Repeated unwanted messages.");
  assert.equal(reported.decisions[0].automated, false);
  assert.doesNotMatch(JSON.stringify(reported), new RegExp(REPORTER), "never who reported");
  const reporter = await as(REPORTER);
  assert.deepEqual(reporter.reports.map((row) => [row.id, row.state]), [["r1", "ACTION_TAKEN"]]);
  assert.doesNotMatch(JSON.stringify(reporter), /Repeated unwanted messages|WARNING/, "the reporter sees the outcome, not the action or statement");
});

test("urgent reports alert the team at once without any report details", () => {
  const route = read("src/app/api/reports/route.ts");
  assert.match(route, /if \(priority === "CRITICAL"\) await notifySafetyTeam\(\{ caseId: data\.id, reason, createdAt:/);
  const alert = read("src/lib/notifications/safetyAlert.ts");
  assert.match(alert, /process\.env\.SAFETY_ALERT_EMAIL \|\| "admin@intimo\.live"/);
  assert.doesNotMatch(alert, /\.description|display_name|reporter_id|reported_user_id/);
  // Overdue reports rise to the top without becoming "urgent", which would demand the critical-case permission.
  const [standard] = normalizeWork("report", [{ id: "s", status: "OPEN", priority: "STANDARD", reason: "SPAM", created_at: "2026-11-18T09:00:00Z", overdue: true }]);
  assert.equal(standard.urgent, false);
  assert.equal(standard.overdue, true);
  const sorted = sortWork([...normalizeWork("report", [{ id: "h", status: "OPEN", priority: "HIGH", reason: "THREATS", created_at: "2026-11-18T08:00:00Z" }]), standard]);
  assert.deepEqual(sorted.map((item) => item.id), ["s", "h"]);
});

test("the migration is additive and appeals are open to both sides through server-only functions", () => {
  const sql = read("supabase/migrations/20261118180000_report_outcomes.sql");
  assert.match(sql, /-- ROLLBACK:/);
  assert.match(sql, /'PROFILE','PHOTO','ALBUM','VIDEO'/, "album reports are accepted");
  assert.match(sql, /v_case\.reported_user_id = p_appellant_id and coalesce\(v_case\.action_taken, 'NO_ACTION'\) <> 'NO_ACTION'/);
  assert.match(sql, /or v_case\.reporter_id = p_appellant_id/);
  assert.match(sql, /revoke all on function public\.intimo_decide_appeal\(uuid, uuid, text, text, text\) from public, anon, authenticated;/);
  assert.doesNotMatch(sql, /\bdrop table\b|\bdelete from\b/i);
  for (const action of Object.keys(outcomes.ACTIONS)) assert.ok(sql.includes(`'${action}'`), action);
  const policyUpdates = read("supabase/migrations/20261119160000_nonconsensual_screenshot_reports.sql");
  for (const ground of Object.keys(outcomes.POLICY_GROUNDS)) assert.ok(sql.includes(`'${ground}'`) || policyUpdates.includes(`'${ground}'`), ground);
});

test("the data export gives reporters no notes about the other member and includes decisions about you", () => {
  const exporter = read("src/app/api/privacy/export/route.ts");
  const submitted = exporter.match(/submittedReports: supabase\.from\("moderation_cases"\)\.select\("([^"]+)"\)/)[1];
  assert.doesNotMatch(submitted, /decision/);
  assert.match(exporter, /decisionsAboutYou: supabase\.from\("moderation_cases"\)\.select\("id,content_type,action_taken,policy_ground,member_statement,decision_timestamp,appeal_status"\)\.eq\("reported_user_id", profileId\)/);
});
