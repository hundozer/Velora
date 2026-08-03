/**
 * Location Fuzzing & Spatial Anonymization Engine
 * Protects members against location triangulation by applying randomized spatial noise.
 */

export interface RawCoordinates {
  latitude: number;
  longitude: number;
}

export interface FuzzedLocationResult {
  fuzzedLatitude: number;
  fuzzedLongitude: number;
  displayCity: string;
  approximateDistanceKm: number;
  precisionMode: "FUZZED_RADIUS" | "CITY_ONLY";
}

/**
 * Applies spatial noise to coordinates (Random 1-5 km offset)
 */
export function applyLocationFuzzing(
  coords: RawCoordinates,
  cityName: string,
  exactDistanceKm: number
): FuzzedLocationResult {
  // Pseudo-random deterministic offset generator based on coordinate string
  const seed = (coords.latitude * 1000 + coords.longitude * 1000) % 360;
  const offsetKm = 1.5 + (seed % 3.5); // 1.5 km to 5.0 km offset

  // Approximate 1 deg lat = 111km, 1 deg lon = 111km * cos(lat)
  const latOffset = (offsetKm / 111) * Math.sin(seed);
  const lonOffset = (offsetKm / (111 * Math.cos((coords.latitude * Math.PI) / 180))) * Math.cos(seed);

  return {
    fuzzedLatitude: Number((coords.latitude + latOffset).toFixed(4)),
    fuzzedLongitude: Number((coords.longitude + lonOffset).toFixed(4)),
    displayCity: cityName,
    approximateDistanceKm: Math.round(exactDistanceKm + (offsetKm - 2.5)),
    precisionMode: "FUZZED_RADIUS",
  };
}
