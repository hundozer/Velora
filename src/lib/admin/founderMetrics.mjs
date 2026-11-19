/**
 * Founding metrics (FM-04): aggregate counts only, computed from rows the admin
 * API has already loaded. No member-level output, no new tracking.
 */
const DAY = 86_400_000;
const WOMEN = new Set(["FEMALE"]);
const MEN = new Set(["MALE"]);
const OTHER = new Set(["NON_BINARY", "TRANSGENDER", "OTHER"]);

const time = (value) => (value ? new Date(value).getTime() : NaN);
const within = (value, from, to) => { const t = time(value); return t >= from && t < to; };
const pct = (part, whole) => (whole ? Math.round((part / whole) * 1000) / 10 : null);

/** Monday 00:00 UTC of the week containing `ms`. */
export function weekStart(ms) {
  const d = new Date(ms);
  const day = (d.getUTCDay() + 6) % 7;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day);
}

/** A member counts when the account is active, not deleted and not staging demo content. */
export function isCountedMember(p) {
  return p.account_status === "ACTIVE" && (!p.account_lifecycle_status || p.account_lifecycle_status === "ACTIVE") && p.is_demo !== true;
}

export function mixOf(p) {
  if (p.is_couple_profile) return "couples";
  if (WOMEN.has(p.gender)) return "women";
  if (MEN.has(p.gender)) return "men";
  if (OTHER.has(p.gender)) return "nonBinaryOrOther";
  return "notStated";
}

/**
 * @param {{ profiles: any[], requests: any[], invites: any[], reports: any[] }} rows
 * @param {number} now
 * @param {number} weeks
 */
export function founderMetrics({ profiles, requests, invites, reports, codes = [] }, now = Date.now(), weeks = 8) {
  const members = profiles.filter(isCountedMember);
  const total = members.length;
  const weekAgo = now - 7 * DAY;
  const monthAgo = now - 30 * DAY;

  const mix = { women: 0, men: 0, couples: 0, nonBinaryOrOther: 0, notStated: 0 };
  for (const p of members) mix[mixOf(p)] += 1;
  const verified = members.filter((p) => p.verification_status === "VERIFIED" || p.verification_status === "IDENTITY_VERIFIED").length;

  const requestStatus = { pending: 0, approved: 0, rejected: 0 };
  const requestMix = { women: 0, men: 0, couples: 0, nonBinaryOrOther: 0 };
  for (const r of requests) {
    if (r.status === "PENDING") requestStatus.pending += 1;
    else if (r.status === "APPROVED") requestStatus.approved += 1;
    else if (r.status === "REJECTED") requestStatus.rejected += 1;
    const key = { WOMAN: "women", MAN: "men", COUPLE: "couples", OTHER: "nonBinaryOrOther" }[r.identity];
    if (key) requestMix[key] += 1;
  }

  // "Sent" means the email provider accepted it; "joined" means the token was redeemed.
  const sent = invites.filter((i) => i.status === "SENT" || i.status === "REDEEMED");
  const joined = invites.filter((i) => i.status === "REDEEMED").length;
  const expired = invites.filter((i) => i.status === "SENT" && time(i.expires_at) < now).length;
  const waiting = invites.filter((i) => i.status === "SENT" && !(time(i.expires_at) < now)).length;

  const reports30d = reports.filter((r) => time(r.created_at) >= monthAgo).length;

  const firstWeek = weekStart(now) - (weeks - 1) * 7 * DAY;
  const weekly = Array.from({ length: weeks }, (_, index) => {
    const from = firstWeek + index * 7 * DAY;
    const to = from + 7 * DAY;
    return {
      weekStart: new Date(from).toISOString().slice(0, 10),
      newMembers: members.filter((p) => within(p.created_at, from, to)).length,
      invitationRequests: requests.filter((r) => within(r.created_at, from, to)).length,
      invitationsSent: sent.filter((i) => within(i.sent_at || i.created_at, from, to)).length,
      invitationsAccepted: invites.filter((i) => i.status === "REDEEMED" && within(i.redeemed_at, from, to)).length,
      reports: reports.filter((r) => within(r.created_at, from, to)).length,
    };
  });

  const sources = {};
  for (const code of codes) {
    const source = code.source_label || "Unlabelled";
    sources[source] = (sources[source] || 0) + (code.uses || 0);
  }

  return {
    invitationCodeSources: Object.entries(sources).map(([source, signups]) => ({source, signups})).sort((a,b) => b.signups-a.signups),
    generatedAt: new Date(now).toISOString(),
    members: {
      total,
      newLast7Days: members.filter((p) => time(p.created_at) >= weekAgo).length,
      activeLast7Days: members.filter((p) => time(p.last_active_at) >= weekAgo).length,
      verified, verifiedPct: pct(verified, total),
      foundingMembers: members.filter((p) => p.membership_level === "FOUNDING_MEMBER").length,
    },
    mix: Object.fromEntries(Object.entries(mix).map(([key, count]) => [key, { count, pct: pct(count, total) }])),
    invitationRequests: { ...requestStatus, total: requests.length, mix: requestMix },
    invitations: { sent: sent.length, joined, waiting, expired, acceptancePct: pct(joined, sent.length) },
    reports: { last30Days: reports30d, per100Members: total ? Math.round((reports30d / total) * 1000) / 10 : null },
    weekly,
  };
}

/** Plain-text summary an admin can paste into an email. Aggregates only. */
export function metricsSummary(m) {
  const share = (x) => (x.pct === null ? "–" : `${x.count} (${x.pct}%)`);
  return [
    `Intimo founding numbers, ${m.generatedAt.slice(0, 10)}`,
    "",
    `Members: ${m.members.total} (${m.members.newLast7Days} new this week, ${m.members.activeLast7Days} active this week)`,
    `Verified: ${m.members.verified}${m.members.verifiedPct === null ? "" : ` (${m.members.verifiedPct}%)`}`,
    `Mix: women ${share(m.mix.women)}, men ${share(m.mix.men)}, couples ${share(m.mix.couples)}, non-binary/other ${share(m.mix.nonBinaryOrOther)}, not stated ${share(m.mix.notStated)}`,
    `Invitation requests: ${m.invitationRequests.total} (${m.invitationRequests.pending} waiting, ${m.invitationRequests.approved} approved, ${m.invitationRequests.rejected} rejected)`,
    `Invitations: ${m.invitations.sent} sent, ${m.invitations.joined} joined${m.invitations.acceptancePct === null ? "" : ` (${m.invitations.acceptancePct}%)`}, ${m.invitations.waiting} waiting, ${m.invitations.expired} expired`,
    `Reports (last 30 days): ${m.reports.last30Days}${m.reports.per100Members === null ? "" : ` (${m.reports.per100Members} per 100 members)`}`,
    `Signups by invitation code source: ${(m.invitationCodeSources || []).map(s=>`${s.source}: ${s.signups}`).join(", ") || "none yet"}`,
  ].join("\n");
}
