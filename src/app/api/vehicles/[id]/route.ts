import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { canAccessVehicle } from "@/lib/access-control";
import { fetchVehicleDetailFromCarLocation } from "@/lib/car-location-api";
import { CATEGORIES } from "@/lib/mock-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const detail = await fetchVehicleDetailFromCarLocation(id);
    if (!detail) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    if (!canAccessVehicle(detail, user!)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const category = CATEGORIES.find((c) => c.id === detail.categoryId);
    return NextResponse.json({
      ...detail,
      categoryName: category?.name ?? detail.categoryName,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "خطا در دریافت جزئیات خودرو";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
