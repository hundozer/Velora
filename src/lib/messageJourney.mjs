// Words that frame a conversation (editorial redesign, Phase 2). Display only:
// POST /api/messages decides what can actually be sent.

const time = (iso) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Prague" });

/** "22:30 until 01:00" for a plan, or "" when times are missing. */
export function planWindow(plan) {
  if (!plan?.expiresAt) return "";
  const start = plan.startsAt ? time(plan.startsAt) : null;
  return start ? `${start} until ${time(plan.expiresAt)}` : `until ${time(plan.expiresAt)}`;
}

/** The explicit-photo line for a thread, from the recipient's boundary. */
export function explicitPhotoRule(preference, established, name) {
  if (preference === "NOT_INTERESTED") return `${name} doesn't accept explicit photographs in chat.`;
  if (preference === "ASK_FIRST" && !established) return `Explicit photographs stay off until ${name} replies.`;
  return "";
}

/**
 * Up to two optional openers, built only from what both people can see: the plan being
 * replied to and desires both list. Never generic pick-up lines.
 */
export function openersFor({ plan = null, shared = [] } = {}) {
  const out = [];
  if (plan?.title) out.push("That sounds like my kind of evening. Room for one more?");
  if (shared[0]) out.push(`We both like ${shared[0]}. What does a good evening of it look like for you?`);
  if (out.length < 2) out.push("Hi — your profile made me smile. How's your evening going?");
  return out.slice(0, 2);
}
