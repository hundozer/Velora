// Tonight, in time order (editorial redesign, Phase 3). Pure helpers so the page and the
// tests agree on what "now", "later tonight" and "tomorrow" mean. Times are Prague time.

const ZONE = "Europe/Prague";
// A night runs from 06:00 to 06:00, so a plan at 01:00 still belongs to "tonight".
const NIGHT_SHIFT_MS = 6 * 3_600_000;

function parts(date) {
  const values = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "long", hourCycle: "h23" }).formatToParts(date).map((part) => [part.type, part.value]));
  return values;
}

/** "22:30" in Prague time. */
export function clock(iso) {
  const p = parts(new Date(iso));
  return `${p.hour}:${p.minute}`;
}

/** "Sunday" in Prague time. */
export function weekday(iso) {
  return parts(new Date(iso)).weekday;
}

/** Prague hour (0–23) a plan starts in, for the timeline's hour markers. */
export function hourOf(iso) {
  return Number(parts(new Date(iso)).hour);
}

/** Which night a moment belongs to: the Prague date of (moment − 6 h). */
export function nightKey(date) {
  const p = parts(new Date(new Date(date).getTime() - NIGHT_SHIFT_MS));
  return `${p.year}-${p.month}-${p.day}`;
}

/** "PRAGUE, TONIGHT · 21:05" */
export function openingLine(now = new Date()) {
  return `Prague, tonight · ${clock(now)}`;
}

/**
 * Splits live plans into what is happening now, later tonight and tomorrow (or later),
 * each in start order. Plans that have ended are dropped.
 * @template {{ startsAt: string, expiresAt: string, isMine?: boolean }} P
 * @param {P[]} plans @param {Date} [now]
 */
export function groupTonight(plans, now = new Date()) {
  const at = now.getTime();
  const tonight = nightKey(now);
  const live = plans
    .filter((plan) => new Date(plan.expiresAt).getTime() > at)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const happening = live.filter((plan) => new Date(plan.startsAt).getTime() <= at);
  const later = live.filter((plan) => new Date(plan.startsAt).getTime() > at && nightKey(plan.startsAt) === tonight);
  const tomorrow = live.filter((plan) => new Date(plan.startsAt).getTime() > at && nightKey(plan.startsAt) !== tonight);
  return { happening, later, tomorrow };
}

/** The time column of the at-a-glance list: "Now", "22:30", or "Sun 19:00" for another night. */
export function glanceTime(plan, now = new Date()) {
  if (new Date(plan.startsAt).getTime() <= now.getTime()) return "Now";
  if (nightKey(plan.startsAt) === nightKey(now)) return clock(plan.startsAt);
  return `${weekday(plan.startsAt).slice(0, 3)} ${clock(plan.startsAt)}`;
}

/** Later-tonight plans bucketed under their starting hour, in order. */
export function byHour(plans) {
  const buckets = [];
  for (const plan of plans) {
    const hour = hourOf(plan.startsAt);
    const last = buckets[buckets.length - 1];
    if (last && last.hour === hour) last.plans.push(plan);
    else buckets.push({ hour, plans: [plan] });
  }
  return buckets;
}

/** Short words for who may reply, for the at-a-glance column: "Women & couples only". */
export function shortAudience(audience) {
  const text = String(audience || "everyone");
  if (text === "everyone") return "Open to everyone";
  return `${text.charAt(0).toUpperCase()}${text.slice(1).replace(/ and /g, " & ")} only`;
}

/**
 * Start and end as ISO strings from what the sentence form shows: a day ("tonight" or
 * "tomorrow") and two local clock times. An end at or before the start runs past midnight.
 */
export function windowFromClock({ day, from, until }, now = new Date()) {
  const [fh, fm] = String(from).split(":").map(Number);
  const [uh, um] = String(until).split(":").map(Number);
  if (![fh, fm, uh, um].every(Number.isFinite)) return null;
  const start = new Date(now);
  start.setHours(fh, fm, 0, 0);
  // "Tonight" after midnight still means the night we're in.
  if (day === "tomorrow") start.setDate(start.getDate() + 1);
  else if (now.getHours() < 6 && fh >= 12) start.setDate(start.getDate() - 1);
  const end = new Date(start);
  end.setHours(uh, um, 0, 0);
  if (end.getTime() <= start.getTime()) end.setDate(end.getDate() + 1);
  return { startsAt: start.toISOString(), endsAt: end.toISOString() };
}

/** "midnight", "01:00" — how the end reads in a sentence. */
export function untilWords(time) {
  return time === "00:00" ? "midnight" : time;
}
