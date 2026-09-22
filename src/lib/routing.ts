import type { MapCoordinate } from "@/types";

type OsrmRouteResponse = {
  code: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: {
      coordinates: [number, number][];
    };
  }>;
};

export type DrivingRoute = {
  coordinates: MapCoordinate[];
  distanceMeters: number;
  durationSeconds: number;
};

function fallbackRoute(origin: MapCoordinate, destination: MapCoordinate): MapCoordinate[] {
  return [
    origin,
    {
      lat: (origin.lat + destination.lat) / 2,
      lng: (origin.lng + destination.lng) / 2,
    },
    destination,
  ];
}

export async function fetchDrivingRoute(
  origin: MapCoordinate,
  destination: MapCoordinate,
): Promise<DrivingRoute> {
  const params = new URLSearchParams({
    originLng: String(origin.lng),
    originLat: String(origin.lat),
    destLng: String(destination.lng),
    destLat: String(destination.lat),
  });

  try {
    const response = await fetch(`/api/routing?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Routing HTTP ${response.status}`);
    }

    const data = (await response.json()) as DrivingRoute;
    if (!data.coordinates?.length) {
      throw new Error("Empty route");
    }

    return data;
  } catch {
    const coordinates = fallbackRoute(origin, destination);
    return {
      coordinates,
      distanceMeters: 1200,
      durationSeconds: 180,
    };
  }
}

export function parseOsrmResponse(data: OsrmRouteResponse): DrivingRoute | null {
  const route = data.routes?.[0];
  if (data.code !== "Ok" || !route?.geometry?.coordinates?.length) {
    return null;
  }

  return {
    coordinates: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
    distanceMeters: route.distance,
    durationSeconds: route.duration,
  };
}
