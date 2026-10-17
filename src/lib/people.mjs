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
  { km: 5, label: "Within 5 km" },
  { km: 10, label: "Within 10 km" },
  { km: 25, label: "Within 25 km" },
];
export const ACTIVE_WINDOWS = { ONLINE: 10 * 60 * 1000, DAY: 24 * 60 * 60 * 1000, WEEK: 7 * 24 * 60 * 60 * 1000 };

const WHO = new Set(WHO_OPTIONS.map((item) => item.value));
const KM = new Set(DISTANCE_OPTIONS.map((item) => item.km));
const CURSOR = /^(\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:\d{2}))\|([0-9a-f-]{36})$/i;

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
  const cursorMatch = (params.get("cursor") || "").match(CURSOR);
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
