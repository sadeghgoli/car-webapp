"use client";

import { useEffect, useState } from "react";
import type { Vehicle, VehicleCategory, VehicleRoute } from "@/types";
import { fetchDrivingRoute } from "@/lib/routing";
import { estimateRouteDurationMs } from "@/lib/route-geometry";

export function useVehicleRoutes(
  vehicles: Vehicle[],
  categories: VehicleCategory[],
): { routes: VehicleRoute[]; loading: boolean } {
  const [routes, setRoutes] = useState<VehicleRoute[]>([]);
  const [loading, setLoading] = useState(true);

  const vehicleKey = vehicles.map((v) => v.id).join(",");

  useEffect(() => {
    let cancelled = false;

    async function loadRoutes() {
      setLoading(true);
      const categoryMap = new Map(categories.map((c) => [c.id, c.color]));

      const results = await Promise.all(
        vehicles.map(async (vehicle) => {
          const route = await fetchDrivingRoute(vehicle.origin, vehicle.destination);
          const color = categoryMap.get(vehicle.categoryId) ?? "#64748b";

          return {
            vehicleId: vehicle.id,
            coordinates: route.coordinates,
            distanceMeters: route.distanceMeters,
            durationMs: estimateRouteDurationMs(
              route.distanceMeters,
              route.durationSeconds,
            ),
            color,
          } satisfies VehicleRoute;
        }),
      );

      if (!cancelled) {
        setRoutes(results);
        setLoading(false);
      }
    }

    if (vehicles.length > 0) {
      void loadRoutes();
    } else {
      setRoutes([]);
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [vehicleKey, categories, vehicles]);

  return { routes, loading };
}
