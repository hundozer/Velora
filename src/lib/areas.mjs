// Prague-first area list (P1-03). Members pick an area, never a position.
// Centroids are approximate district centres rounded to 3 decimals (~100 m);
// they exist only to compute coarse distance buckets between areas.
// Must stay in sync with supabase/migrations/20261020_prague_areas.sql (enforced by test).

export const AREA_KINDS = ["PRAGUE_DISTRICT", "NEAR_PRAGUE", "CZECHIA", "ABROAD"];

export const AREAS = [
  { id: "praha-1", name: "Praha 1", label: "Old Town · Malá Strana", kind: "PRAGUE_DISTRICT", lat: 50.087, lng: 14.421 },
  { id: "praha-2", name: "Praha 2", label: "Vinohrady · Nové Město", kind: "PRAGUE_DISTRICT", lat: 50.075, lng: 14.432 },
  { id: "praha-3", name: "Praha 3", label: "Žižkov", kind: "PRAGUE_DISTRICT", lat: 50.084, lng: 14.462 },
  { id: "praha-4", name: "Praha 4", label: "Nusle · Michle · Podolí", kind: "PRAGUE_DISTRICT", lat: 50.039, lng: 14.452 },
  { id: "praha-5", name: "Praha 5", label: "Smíchov · Barrandov", kind: "PRAGUE_DISTRICT", lat: 50.062, lng: 14.386 },
  { id: "praha-6", name: "Praha 6", label: "Dejvice · Břevnov", kind: "PRAGUE_DISTRICT", lat: 50.100, lng: 14.360 },
  { id: "praha-7", name: "Praha 7", label: "Holešovice · Letná", kind: "PRAGUE_DISTRICT", lat: 50.104, lng: 14.433 },
  { id: "praha-8", name: "Praha 8", label: "Karlín · Libeň · Bohnice", kind: "PRAGUE_DISTRICT", lat: 50.117, lng: 14.462 },
  { id: "praha-9", name: "Praha 9", label: "Vysočany · Prosek", kind: "PRAGUE_DISTRICT", lat: 50.111, lng: 14.503 },
  { id: "praha-10", name: "Praha 10", label: "Vršovice · Strašnice", kind: "PRAGUE_DISTRICT", lat: 50.067, lng: 14.483 },
  { id: "praha-11", name: "Praha 11", label: "Chodov · Háje", kind: "PRAGUE_DISTRICT", lat: 50.031, lng: 14.505 },
  { id: "praha-12", name: "Praha 12", label: "Modřany · Kamýk", kind: "PRAGUE_DISTRICT", lat: 50.005, lng: 14.415 },
  { id: "praha-13", name: "Praha 13", label: "Stodůlky", kind: "PRAGUE_DISTRICT", lat: 50.047, lng: 14.330 },
  { id: "praha-14", name: "Praha 14", label: "Černý Most · Kyje", kind: "PRAGUE_DISTRICT", lat: 50.104, lng: 14.565 },
  { id: "praha-15", name: "Praha 15", label: "Hostivař", kind: "PRAGUE_DISTRICT", lat: 50.049, lng: 14.539 },
  { id: "praha-16", name: "Praha 16", label: "Radotín", kind: "PRAGUE_DISTRICT", lat: 49.983, lng: 14.356 },
  { id: "praha-17", name: "Praha 17", label: "Řepy", kind: "PRAGUE_DISTRICT", lat: 50.069, lng: 14.300 },
  { id: "praha-18", name: "Praha 18", label: "Letňany", kind: "PRAGUE_DISTRICT", lat: 50.134, lng: 14.515 },
  { id: "praha-19", name: "Praha 19", label: "Kbely", kind: "PRAGUE_DISTRICT", lat: 50.133, lng: 14.546 },
  { id: "praha-20", name: "Praha 20", label: "Horní Počernice", kind: "PRAGUE_DISTRICT", lat: 50.112, lng: 14.610 },
  { id: "praha-21", name: "Praha 21", label: "Újezd nad Lesy", kind: "PRAGUE_DISTRICT", lat: 50.073, lng: 14.663 },
  { id: "praha-22", name: "Praha 22", label: "Uhříněves", kind: "PRAGUE_DISTRICT", lat: 50.036, lng: 14.588 },
  { id: "kladno", name: "Kladno", label: "Near Prague", kind: "NEAR_PRAGUE", lat: 50.147, lng: 14.103 },
  { id: "beroun", name: "Beroun", label: "Near Prague", kind: "NEAR_PRAGUE", lat: 49.964, lng: 14.072 },
  { id: "melnik", name: "Mělník", label: "Near Prague", kind: "NEAR_PRAGUE", lat: 50.351, lng: 14.474 },
  { id: "brandys", name: "Brandýs n. L.–St. Boleslav", label: "Near Prague", kind: "NEAR_PRAGUE", lat: 50.187, lng: 14.663 },
  { id: "ricany", name: "Říčany", label: "Near Prague", kind: "NEAR_PRAGUE", lat: 49.992, lng: 14.654 },
  { id: "cernosice", name: "Černošice", label: "Near Prague", kind: "NEAR_PRAGUE", lat: 49.960, lng: 14.320 },
  { id: "roztoky", name: "Roztoky", label: "Near Prague", kind: "NEAR_PRAGUE", lat: 50.158, lng: 14.398 },
  { id: "kralupy", name: "Kralupy n. Vltavou", label: "Near Prague", kind: "NEAR_PRAGUE", lat: 50.241, lng: 14.311 },
  { id: "benesov", name: "Benešov", label: "Near Prague", kind: "NEAR_PRAGUE", lat: 49.782, lng: 14.687 },
  { id: "mlada-boleslav", name: "Mladá Boleslav", label: "Near Prague", kind: "NEAR_PRAGUE", lat: 50.411, lng: 14.903 },
  { id: "cz-other", name: "Elsewhere in Czechia", label: "Czechia", kind: "CZECHIA", lat: null, lng: null },
  { id: "abroad", name: "Outside Czechia", label: "Abroad", kind: "ABROAD", lat: null, lng: null },
];

const BY_ID = new Map(AREAS.map((area) => [area.id, area]));

export function areaById(id) {
  return typeof id === "string" ? BY_ID.get(id) ?? null : null;
}

export function isPragueArea(id) {
  return areaById(id)?.kind === "PRAGUE_DISTRICT";
}

/** Derived display/location fields written alongside area_id so existing surfaces keep working. */
export function locationFieldsForArea(id) {
  const area = areaById(id);
  if (!area) return null;
  if (area.kind === "PRAGUE_DISTRICT") return { city: "Prague", country: "Czech Republic", location: `${area.name}, Prague` };
  if (area.kind === "NEAR_PRAGUE") return { city: area.name, country: "Czech Republic", location: `${area.name}, near Prague` };
  if (area.kind === "CZECHIA") return { city: "", country: "Czech Republic", location: "Czechia" };
  return { city: "", country: "", location: "" };
}

function haversineKm(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** Area-to-area distance in km, or null when either side has no centroid. */
export function areaDistanceKm(fromId, toId) {
  const from = areaById(fromId);
  const to = areaById(toId);
  if (!from || !to || from.lat == null || to.lat == null) return null;
  return haversineKm(from, to);
}

/**
 * Coarse distance bucket. Never exposes anything finer than the area itself:
 * the same area reads as "same area", not "0 km".
 */
export function distanceBucket(fromId, toId) {
  if (fromId && fromId === toId && areaById(fromId)?.lat != null) return "SAME_AREA";
  const km = areaDistanceKm(fromId, toId);
  if (km == null) return null;
  if (km < 2) return "UNDER_2";
  if (km < 5) return "UNDER_5";
  if (km < 10) return "UNDER_10";
  if (km < 25) return "UNDER_25";
  return "OVER_25";
}

export const DISTANCE_BUCKET_LABELS = {
  SAME_AREA: "Same area",
  UNDER_2: "< 2 km",
  UNDER_5: "2–5 km",
  UNDER_10: "5–10 km",
  UNDER_25: "10–25 km",
  OVER_25: "25+ km",
};
