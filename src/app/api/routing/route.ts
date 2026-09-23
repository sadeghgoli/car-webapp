import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { OSRM_BASE_URL } from "@/lib/map-config";
import { parseOsrmResponse } from "@/lib/routing";
import type { MapCoordinate } from "@/types";

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const originLat = Number(searchParams.get("originLat"));
  const originLng = Number(searchParams.get("originLng"));
  const destLat = Number(searchParams.get("destLat"));
  const destLng = Number(searchParams.get("destLng"));

  if ([originLat, originLng, destLat, destLng].some((v) => Number.isNaN(v))) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const origin: MapCoordinate = { lat: originLat, lng: originLng };
  const destination: MapCoordinate = { lat: destLat, lng: destLng };

  const url =
    `${OSRM_BASE_URL}/route/v1/driving/` +
    `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
    `?overview=full&geometries=geojson&steps=false`;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    });
    if (!response.ok) {
      throw new Error(`OSRM HTTP ${response.status}`);
    }

    const data = await response.json();
    const route = parseOsrmResponse(data);
    if (!route) {
      throw new Error("OSRM returned no route");
    }

    return NextResponse.json(route);
  } catch {
    return NextResponse.json({
      coordinates: [origin, destination],
      distanceMeters: 1000,
      durationSeconds: 120,
    });
  }
}
