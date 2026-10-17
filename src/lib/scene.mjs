// Prague Scene v0 (P1-21): curated, outbound-linked listings. Not an event platform.
import { areaById } from "./areas.mjs";

export const SCENE_KINDS = [
  { value: "MUNCH", label: "Munch" },
  { value: "WORKSHOP", label: "Workshop" },
  { value: "PARTY", label: "Party" },
  { value: "CLUB_NIGHT", label: "Club night" },
  { value: "MEETUP", label: "Meetup" },
  { value: "OTHER", label: "Other" },
];
const KINDS = new Set(SCENE_KINDS.map((kind) => kind.value));

export function sceneKindLabel(value) {
  return SCENE_KINDS.find((kind) => kind.value === value)?.label ?? "Event";
}

/**
 * Validates a listing. Returns { error } or { event } with column names.
 * @param {Record<string, unknown>} input @param {Date} [now]
 */
export function validateSceneEvent(input, now = new Date()) {
  const text = (value, max) => (typeof value === "string" ? value.trim().slice(0, max) : "");
  const title = text(input.title, 120);
  const organiser = text(input.organiser, 120);
  const venueName = text(input.venueName, 120);
  const description = text(input.description, 600);
  const kind = typeof input.kind === "string" && KINDS.has(input.kind) ? input.kind : null;
  const startsAt = new Date(String(input.startsAt || ""));
  const endsAt = input.endsAt ? new Date(String(input.endsAt)) : null;
  let url = null;
  try {
    const parsed = new URL(String(input.url || ""));
    if (parsed.protocol === "https:") url = parsed.toString();
  } catch { /* invalid */ }
  if (title.length < 3) return { error: "Add a title." };
  if (!kind) return { error: "Choose what kind of event it is." };
  if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() < now.getTime() - 3_600_000) return { error: "Choose a start time in the future." };
  if (endsAt && (Number.isNaN(endsAt.getTime()) || endsAt <= startsAt)) return { error: "The end must be after the start." };
  if (!url) return { error: "Add the organiser's https link." };
  if (organiser.length < 2) return { error: "Add the organiser." };
  const areaId = typeof input.areaId === "string" && areaById(input.areaId) ? input.areaId : null;
  return { event: { title, kind, starts_at: startsAt.toISOString(), ends_at: endsAt ? endsAt.toISOString() : null, venue_name: venueName || null, area_id: areaId, organiser, description: description || null, url } };
}
