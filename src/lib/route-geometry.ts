import type { MapCoordinate } from "@/types";

export function haversineMeters(a: MapCoordinate, b: MapCoordinate): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function bearingDegrees(a: MapCoordinate, b: MapCoordinate): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLon = toRad(b.lng - a.lng);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export type RouteSegment = {
  start: MapCoordinate;
  end: MapCoordinate;
  length: number;
  startDistance: number;
};

export function buildRouteSegments(route: MapCoordinate[]) {
  const segments: RouteSegment[] = [];
  let totalLength = 0;

  for (let i = 0; i < route.length - 1; i += 1) {
    const start = route[i];
    const end = route[i + 1];
    const length = Math.max(haversineMeters(start, end), 1);
    segments.push({ start, end, length, startDistance: totalLength });
    totalLength += length;
  }

  return { segments, totalLength };
}

export function interpolateAlongRoute(
  route: MapCoordinate[],
  progress: number,
): { coordinate: MapCoordinate; bearing: number } | null {
  if (route.length < 2) return null;

  const { segments, totalLength } = buildRouteSegments(route);
  const distance = progress * totalLength;
  const segment =
    segments.find(
      (item) =>
        distance <= item.startDistance + item.length ||
        item === segments[segments.length - 1],
    ) ?? segments[segments.length - 1];

  const localT = Math.min(
    1,
    Math.max(0, (distance - segment.startDistance) / segment.length),
  );

  return {
    coordinate: {
      lat: lerp(segment.start.lat, segment.end.lat, localT),
      lng: lerp(segment.start.lng, segment.end.lng, localT),
    },
    bearing: bearingDegrees(segment.start, segment.end),
  };
}

export function estimateRouteDurationMs(
  distanceMeters: number,
  durationSeconds: number,
): number {
  return Math.min(45000, Math.max(18000, durationSeconds * 1000 * 0.35));
}
