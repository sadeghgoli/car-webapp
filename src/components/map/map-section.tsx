"use client";

import dynamic from "next/dynamic";
import { useVehicles, useCategories } from "@/hooks/use-api";
import { VehicleDetailPanel } from "@/components/panels/vehicle-detail-panel";
import { Loader2, MapPin } from "lucide-react";
import { useDashboardStore } from "@/stores/dashboard-store";

const VehicleMap = dynamic(
  () => import("@/components/map/vehicle-map").then((m) => m.VehicleMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-slate-100">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-3 text-sm text-slate-500">در حال بارگذاری نقشه...</p>
        </div>
      </div>
    ),
  },
);

export function MapSection() {
  const { data: vehicles, isLoading: vehiclesLoading, isError } = useVehicles(15000);
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const activeLayerIds = useDashboardStore((s) => s.activeLayerIds);

  const activeCount = vehicles?.filter((v) => activeLayerIds.has(v.categoryId)).length ?? 0;

  return (
    <div className="relative flex-1">
      <div className="absolute right-4 top-4 z-[1000] flex items-center gap-2 rounded-xl bg-white/95 px-4 py-2 shadow-lg backdrop-blur-sm">
        <MapPin className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-slate-700">
          {vehiclesLoading ? "..." : `${activeCount} خودرو روی نقشه`}
        </span>
      </div>

      {(vehiclesLoading || categoriesLoading) && (
        <div className="flex h-full items-center justify-center bg-slate-100">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {isError && (
        <div className="flex h-full items-center justify-center bg-red-50">
          <p className="text-sm text-red-600">خطا در دریافت اطلاعات خودروها</p>
        </div>
      )}

      {vehicles && categories && (
        <VehicleMap vehicles={vehicles} categories={categories} />
      )}

      <VehicleDetailPanel />
    </div>
  );
}
