import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { filterVehiclesByAccess } from "@/lib/access-control";
import { fetchVehiclesFromCarLocation } from "@/lib/car-location-api";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  try {
    const vehicles = filterVehiclesByAccess(await fetchVehiclesFromCarLocation(), user!);
    return NextResponse.json(vehicles);
  } catch (err) {
    const message = err instanceof Error ? err.message : "خطا در دریافت خودروها";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
