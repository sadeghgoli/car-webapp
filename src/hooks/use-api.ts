"use client";

import { useQuery } from "@tanstack/react-query";
import type { Vehicle, VehicleCategory, VehicleDetail } from "@/types";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export function useCategories() {
  return useQuery<VehicleCategory[]>({
    queryKey: ["categories"],
    queryFn: () => fetchJson("/api/categories"),
  });
}

export function useVehicles(refetchInterval: number | false = false) {
  return useQuery<Vehicle[]>({
    queryKey: ["vehicles"],
    queryFn: () => fetchJson("/api/vehicles"),
    refetchInterval,
  });
}

export function useVehicleDetail(id: string | null) {
  return useQuery<VehicleDetail>({
    queryKey: ["vehicle", id],
    queryFn: () => fetchJson(`/api/vehicles/${id}`),
    enabled: !!id,
  });
}
