import { create } from "zustand";
import type { Vehicle } from "@/types";

interface DashboardState {
  activeLayerIds: Set<string>;
  selectedVehicleId: string | null;
  toggleLayer: (categoryId: string) => void;
  setActiveLayers: (categoryIds: string[]) => void;
  selectVehicle: (vehicleId: string | null) => void;
  initializeLayers: (categoryIds: string[]) => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  activeLayerIds: new Set(),
  selectedVehicleId: null,

  toggleLayer: (categoryId) => {
    const current = new Set(get().activeLayerIds);
    if (current.has(categoryId)) {
      current.delete(categoryId);
    } else {
      current.add(categoryId);
    }
    set({ activeLayerIds: current });
  },

  setActiveLayers: (categoryIds) => {
    set({ activeLayerIds: new Set(categoryIds) });
  },

  selectVehicle: (vehicleId) => {
    set({ selectedVehicleId: vehicleId });
  },

  initializeLayers: (categoryIds) => {
    set({ activeLayerIds: new Set(categoryIds) });
  },
}));

export function filterVehiclesByLayers(
  vehicles: Vehicle[],
  activeLayerIds: Set<string>,
): Vehicle[] {
  if (activeLayerIds.size === 0) return [];
  return vehicles.filter((v) => activeLayerIds.has(v.categoryId));
}
