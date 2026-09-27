import type { GeoPos } from "./types";

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance between two WGS-84 points, in km. */
export function haversineKm(a: GeoPos, b: GeoPos): number {
  const toRad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toRad;
  const dLon = (b.lon - a.lon) * toRad;
  const lat1 = a.lat * toRad;
  const lat2 = b.lat * toRad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Rounding helper used across the UI so distances read like field reports. */
export function distanceKm(a: GeoPos, b: GeoPos): number {
  return Math.round(haversineKm(a, b) * 10) / 10;
}

export function routeDistanceKm(points: GeoPos[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += haversineKm(points[i - 1], points[i]);
  return Math.round(total * 10) / 10;
}

/** Decimal degrees → DDD°MM.mmm' with hemisphere letter. */
export function fmtLat(v: number): string {
  const hemi = v >= 0 ? "N" : "S";
  const abs = Math.abs(v);
  const deg = Math.floor(abs);
  const min = (abs - deg) * 60;
  return `${String(deg).padStart(3, "0")}°${min.toFixed(3).padStart(6, "0")}'${hemi}`;
}

export function fmtLon(v: number): string {
  const hemi = v >= 0 ? "E" : "W";
  const abs = Math.abs(v);
  const deg = Math.floor(abs);
  const min = (abs - deg) * 60;
  return `${String(deg).padStart(3, "0")}°${min.toFixed(3).padStart(6, "0")}'${hemi}`;
}

/** Compact signed decimal format for tight UI slots. */
export function fmtDec(v: number, digits = 4): string {
  return `${v >= 0 ? "" : "−"}${Math.abs(v).toFixed(digits)}°`;
}
