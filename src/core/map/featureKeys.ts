// src/core/map/featureKeys.ts
export function round(n: number, d = 5) {
  const p = 10 ** d;
  return Math.round(n * p) / p;
}

// Prefer a string name if present; else fall back to rounded coords.
// Works across Mapshaper exports and future API responses.
export function getFeatureKey(
  props: any,
  geometry: GeoJSON.Geometry,
): string | null {
  const byName = props?.Name ?? props?.Nom ?? props?.title ?? null;
  if (byName && typeof byName === "string") return byName;

  if (geometry.type === "Point") {
    const [lng, lat] = geometry.coordinates as [number, number];
    return `${round(lng, 5)},${round(lat, 5)}`;
  }
  return null;
}
