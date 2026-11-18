/**
 * FM-07: what happens after a report (EU Digital Services Act, Art. 16, 17 and 20).
 *
 * - The reporter is told the outcome, never what happened to the other person.
 * - The reported member gets a statement of reasons only when action was taken, and only
 *   once it's decided: open or dismissed reports are never shown to them.
 * - Either side may ask for the decision to be reviewed once (an appeal).
 * - Response-time targets: 1 hour for suspected minors, non-consensual intimate content and
 *   trafficking, 12 hours for everything else.
 */

export const RESPONSE_TARGET_HOURS = { CRITICAL: 1, HIGH: 12, STANDARD: 12 };

/** Member-facing names for what was done. NO_ACTION is the only choice for a dismissed report. */
export const ACTIONS = {
  NO_ACTION: "No action",
  WARNING: "A warning",
  CONTENT_REMOVED: "The content was removed",
  FEATURE_RESTRICTED: "Some features were restricted",
  ACCOUNT_SUSPENDED: "The account was suspended",
  ACCOUNT_BANNED: "The account was closed permanently",
};

/** Which community guideline the decision relies on (the ground stated to the member). */
export const POLICY_GROUNDS = {
  MINORS: "Adults only: anyone under 18 is not allowed",
  CONSENT: "Consent: intimate content of someone without their consent",
  HARASSMENT: "Respect: harassment, threats or unwanted contact",
  IMPERSONATION: "Honesty: fake identity or impersonation",
  SCAM: "Honesty: scams, fraud or selling sex",
  PRIVACY: "Privacy: sharing someone's personal information",
  ILLEGAL: "Illegal content",
  COPYRIGHT: "Someone else's copyrighted content",
  SPAM: "Spam or advertising",
  OTHER: "Another community guideline",
};

/** The ground a report reason usually points to, as the admin form's starting choice. */
export const DEFAULT_GROUND = {
  SUSPECTED_MINOR: "MINORS", NON_CONSENSUAL_INTIMATE_CONTENT: "CONSENT", EXPLOITATION_TRAFFICKING: "ILLEGAL",
  HARASSMENT: "HARASSMENT", THREATS: "HARASSMENT", IMPERSONATION: "IMPERSONATION", SCAM_FRAUD: "SCAM",
  PROHIBITED_COMMERCIAL_SEXUAL_SERVICES: "SCAM", PRIVACY_VIOLATION: "PRIVACY", ILLEGAL_CONTENT: "ILLEGAL",
  COPYRIGHT_INFRINGEMENT: "COPYRIGHT", SPAM: "SPAM", OTHER: "OTHER",
};

export const APPEAL_OUTCOMES = ["UPHELD", "OVERTURNED", "PARTIALLY_OVERTURNED"];

/** When a case should be decided by. */
export function dueAt(row) {
  const created = Date.parse(row?.created_at || "");
  if (!Number.isFinite(created)) return null;
  const hours = RESPONSE_TARGET_HOURS[row?.priority] ?? RESPONSE_TARGET_HOURS.STANDARD;
  return new Date(created + hours * 3_600_000).toISOString();
}

/** True when an open case has passed its target. */
export function isOverdue(row, now = Date.now()) {
  if (!["OPEN", "UNDER_REVIEW", "ACTION_REQUIRED", "ESCALATED"].includes(row?.status)) return false;
  const due = Date.parse(dueAt(row) || "");
  return Number.isFinite(due) && now > due;
}

const clean = (value, max) => typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";

/**
 * Validates a final decision. RESOLVED means action was taken: it needs an action, a ground
 * and an explanation written for the member (at least 20 characters). REJECTED means no
 * breach was found: the action is NO_ACTION and nothing is sent to the reported member.
 * Returns { value } with the columns to store, or { error }.
 */
export function cleanDecision(status, input = {}) {
  if (status === "REJECTED") return { value: { action_taken: "NO_ACTION", policy_ground: null, member_statement: null } };
  if (status !== "RESOLVED") return { value: {} };
  const action = input.actionTaken;
  if (!action || action === "NO_ACTION" || !(action in ACTIONS)) return { error: "Choose the action that was taken" };
  if (!(input.policyGround in POLICY_GROUNDS)) return { error: "Choose the guideline the decision relies on" };
  const statement = clean(input.memberStatement, 2000);
  if (statement.length < 20) return { error: "Explain the decision to the member in at least 20 characters" };
  return { value: { action_taken: action, policy_ground: input.policyGround, member_statement: statement } };
}

/** The reporter's notice: the outcome only. */
export function reporterNotice(status) {
  if (status === "RESOLVED") return { title: "Your report: we took action", message: "Thank you. We reviewed your report and acted under our community guidelines. For privacy we don't share what happened to the other member." };
  if (status === "REJECTED") return { title: "Your report: no breach found", message: "Thank you. We reviewed your report and didn't find a breach of our community guidelines. You can ask us to look again in Settings → Privacy Center." };
  return null;
}

/** The reported member's notice that a statement of reasons is waiting. */
export const AFFECTED_NOTICE = { title: "A moderation decision about your account", message: "We took action after a review. Read why, and how to appeal, in Settings → Privacy Center." };

/** Appeal notices, for whoever appealed. */
export function appealNotice(outcome) {
  if (outcome === "UPHELD") return { title: "Your appeal: decision upheld", message: "We reviewed the decision again and it stays as it was. Read the explanation in Settings → Privacy Center." };
  if (outcome === "OVERTURNED") return { title: "Your appeal: decision reversed", message: "We reviewed the decision again and reversed it. Read the explanation in Settings → Privacy Center." };
  if (outcome === "PARTIALLY_OVERTURNED") return { title: "Your appeal: decision changed", message: "We reviewed the decision again and changed part of it. Read the explanation in Settings → Privacy Center." };
  return null;
}

/** True when the affected member may see this case: decided with action, or under appeal after that. */
export function affectedMemberMaySee(row) {
  return Boolean(row?.action_taken && row.action_taken !== "NO_ACTION" && (["RESOLVED", "APPEALED"].includes(row.status) || row.appeal_status !== "NONE"));
}

/** What the reporter sees about their own report. */
export function reporterState(row) {
  if (row?.status === "APPEALED") return "IN_APPEAL";
  if (row?.status === "RESOLVED") return "ACTION_TAKEN";
  if (row?.status === "REJECTED") return "NO_BREACH";
  return "IN_REVIEW";
}

/** True when this member may appeal this case now. */
export function mayAppeal(row, profileId) {
  if (!row || row.appeal_status !== "NONE" || !["RESOLVED", "REJECTED"].includes(row.status)) return false;
  if (row.reported_user_id === profileId) return affectedMemberMaySee(row);
  return row.reporter_id === profileId;
}
