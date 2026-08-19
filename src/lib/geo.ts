/**
 * Geo helpers for proximity discovery.
 *
 * Finding "pings near me" is done in two stages, which is why both a
 * bounding box and an exact distance live here:
 *
 *   1. boundingBox()  -> cheap lat/lng range the database can index-scan.
 *      A box always contains the circle, so it never misses a result, but
 *      it over-selects at the corners (up to ~27% extra area).
 *   2. distanceKm()   -> exact great-circle distance, used client-side to
 *      trim those corner rows down to a true circle.
 *
 * This avoids needing the PostGIS extension while staying fast.
 */

const EARTH_RADIUS_KM = 6371;

const toRad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Great-circle (Haversine) distance between two points, in kilometres.
 * Accurate to well under a metre at city scale.
 */
export function distanceKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/**
 * Smallest lat/lng box guaranteed to contain every point within
 * `radiusKm` of the centre.
 *
 * Latitude degrees are a constant ~111 km apart. Longitude degrees narrow
 * as you approach the poles, so the longitude span is divided by
 * cos(latitude) — without that, the box would be too narrow and would drop
 * valid results at high latitudes.
 */
export function boundingBox(
  lat: number,
  lng: number,
  radiusKm: number
): BoundingBox {
  const latDelta = radiusKm / 111.32;

  // Guard against division by ~0 at the poles, where longitude collapses.
  const cosLat = Math.cos(toRad(lat));
  const lngDelta =
    Math.abs(cosLat) < 1e-6 ? 180 : radiusKm / (111.32 * Math.abs(cosLat));

  return {
    minLat: Math.max(-90, lat - latDelta),
    maxLat: Math.min(90, lat + latDelta),
    minLng: Math.max(-180, lng - lngDelta),
    maxLng: Math.min(180, lng + lngDelta),
  };
}

/** "450 m" under a kilometre, "2.4 km" above it — for map labels. */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}
