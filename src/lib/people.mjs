// People v3 (P1-05): one place that turns query params into server-side filters.
import { AREAS, areaById, areaDistanceKm } from "./areas.mjs";
import { parseDesireFilter } from "./desires.mjs";

export const PEOPLE_PAGE_SIZE = 24;
export const WHO_OPTIONS = [
  { value: "WOMEN", label: "Women" },
  { value: "MEN", label: "Men" },
  { value: "COUPLES", label: "Couples" },
  { value: "OTHER", label: "Non-binary & trans" },
];
export const DISTANCE_OPTIONS = [
  { km: 2, label: "Within 2 km" },
  { km: 5, label: "Within 5 km" },
  { km: 10, label: "Within 10 km" },
  { km: 25, label: "Within 25 km" },
];
export const ACTIVE_WINDOWS = { ONLINE: 10 * 60 * 1000, DAY: 24 * 60 * 60 * 1000, WEEK: 7 * 24 * 60 * 60 * 1000 };

const WHO = new Set(WHO_OPTIONS.map((item) => item.value));
const KM = new Set(DISTANCE_OPTIONS.map((item) => item.km));
const CURSOR = /^(\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:\d{2}))\|([0-9a-f-]{36})$/i;
// Activity order pages through two phases: A = members showing activity this week, by
// last activity; R = everyone else ("Other people nearby"), by join date, so a hidden
// member's real activity never influences where they appear.
const ACTIVITY_CURSOR = /^(?:R|([AR])\|(\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:\d{2}))\|([0-9a-f-]{36}))$/i;
/** Cursor for the first page of "Other people nearby" when this week's members end exactly on a page. */
export const ACTIVITY_REST_START = "R";
export const SEARCH_MAX_LENGTH = 40;
export const INTRODUCTIONS_MAX = 5;
export const NEW_MEMBER_DAYS = 14;

/** @param {URLSearchParams} params */
export function parsePeopleFilters(params) {
  const intIn = (value, min, max, fallback) => {
    const number = Number(value);
    return Number.isInteger(number) && number >= min && number <= max ? number : fallback;
  };
  const minAge = intIn(params.get("minAge"), 18, 99, 18);
  const maxAge = Math.max(minAge, intIn(params.get("maxAge"), 18, 99, 99));
  const who = [...new Set((params.get("who") || "").split(",").filter((value) => WHO.has(value)))];
  const km = Number(params.get("withinKm"));
  const active = params.get("active");
  const sort = params.get("sort") === "activity" ? "activity" : "new";
  const rawCursor = params.get("cursor") || "";
  const cursorMatch = sort === "new" ? rawCursor.match(CURSOR) : null;
  const activityMatch = sort === "activity" ? rawCursor.match(ACTIVITY_CURSOR) : null;
  return {
    who,
    minAge,
    maxAge,
    withinKm: KM.has(km) ? km : null,
    desires: parseDesireFilter(params.get("desires")),
    hasPhoto: params.get("hasPhoto") === "true",
    verified: params.get("verified") === "true",
    active: active === "ONLINE" || active === "DAY" || active === "WEEK" ? active : null,
    newWithinDays: params.get("new") === "true" ? 14 : null,
    limit: intIn(params.get("limit"), 1, 48, PEOPLE_PAGE_SIZE),
    cursor: cursorMatch ? { createdAt: cursorMatch[1], id: cursorMatch[2] } : null,
    sort,
    activityCursor: !activityMatch ? null : activityMatch[1] ? { phase: activityMatch[1].toUpperCase(), at: activityMatch[2], id: activityMatch[3] } : { phase: "R", at: null, id: null },
    q: normaliseSearch(params.get("q")),
  };
}

/** Area ids whose centroid is within km of the viewer's area (always includes the viewer's own area). */
export function areaIdsWithin(viewerAreaId, km) {
  if (!areaById(viewerAreaId) || areaById(viewerAreaId).lat == null) return null;
  return AREAS.filter((area) => area.id === viewerAreaId || (areaDistanceKm(viewerAreaId, area.id) ?? Infinity) <= km).map((area) => area.id);
}

/** PostgREST or() expression for the "who" filter, or null for everyone. */
export function whoFilterExpression(who) {
  if (!who.length || who.length === WHO.size) return null;
  const parts = [];
  if (who.includes("WOMEN")) parts.push("and(gender.eq.FEMALE,is_couple_profile.eq.false)");
  if (who.includes("MEN")) parts.push("and(gender.eq.MALE,is_couple_profile.eq.false)");
  if (who.includes("COUPLES")) parts.push("is_couple_profile.eq.true");
  if (who.includes("OTHER")) parts.push("and(gender.in.(NON_BINARY,TRANSGENDER,OTHER),is_couple_profile.eq.false)");
  return parts.join(",");
}

export function encodeCursor(row) {
  return `${row.created_at}|${row.id}`;
}

/** Trims a name-or-neighbourhood search and drops characters PostgREST filters treat as syntax. */
export function normaliseSearch(value) {
  const text = String(value || "").replace(/[,()*%_\\:"'.]/g, " ").replace(/\s+/g, " ").trim().slice(0, SEARCH_MAX_LENGTH);
  return text.length >= 2 ? text : null;
}

const fold = (text) => String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Area ids whose name or neighbourhood label contains the search ("holesovice" finds Praha 7). */
export function areaIdsMatching(q) {
  const needle = fold(q);
  if (!needle) return [];
  return AREAS.filter((area) => fold(area.name).includes(needle) || fold(area.label).includes(needle)).map((area) => area.id);
}

/**
 * PostgREST or() expression for a search: display name, or an area the member shows.
 * Members who hide their location never match by neighbourhood.
 */
export function searchExpression(q) {
  if (!q) return null;
  const parts = [`display_name.ilike.*${q}*`];
  const areas = areaIdsMatching(q);
  if (areas.length) parts.push(`and(area_id.in.(${areas.join(",")}),location_precision.neq.HIDDEN)`);
  return parts.join(",");
}

/** Combines several or() expressions so all of them must hold (one or= parameter). */
export function allOf(expressions) {
  const list = expressions.filter(Boolean);
  if (list.length === 0) return null;
  if (list.length === 1) return list[0];
  return `and(${list.map((expression) => `or(${expression})`).join(",")})`;
}

/** Profiles the viewer may see in discovery: members-visible ones, plus FRIENDS_ONLY friends. */
export function audienceExpression(friendIds) {
  const ids = [...friendIds];
  return ids.length ? `profile_visibility.in.(EVERYONE,MEMBERS_ONLY),and(profile_visibility.eq.FRIENDS_ONLY,id.in.(${ids.join(",")}))` : "profile_visibility.in.(EVERYONE,MEMBERS_ONLY)";
}

export function encodeActivityCursor(phase, row) {
  return `${phase}|${phase === "A" ? row.last_active_at : row.created_at}|${row.id}`;
}

/** Group headings of the Everyone index, keyed by presence bucket (null = hidden or quiet). */
export const ACTIVITY_GROUPS = [
  { presence: "ONLINE", label: "Here now" },
  { presence: "TODAY", label: "Earlier today" },
  { presence: "WEEK", label: "This week" },
  { presence: null, label: "Other people nearby" },
];

function hash32(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

/**
 * Up to five Introductions: online first, then new, then recently active.
 * Within each pool the order rotates per viewer and per day, so the same few members
 * are not always shown first and nobody is ranked by "fit".
 */
export function chooseIntroductions({ online = [], fresh = [], recent = [] }, { viewerId, day, max = INTRODUCTIONS_MAX }) {
  const seen = new Set();
  const picked = [];
  const rotate = (pool) => [...pool].sort((a, b) => hash32(`${viewerId}:${day}:${a.id}`) - hash32(`${viewerId}:${day}:${b.id}`));
  for (const [reason, pool] of [["ONLINE", online], ["NEW", fresh], ["RECENT", recent]]) {
    for (const row of rotate(pool)) {
      if (picked.length >= max) return picked;
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      picked.push({ row, reason });
    }
  }
  return picked;
}
