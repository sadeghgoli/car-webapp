import type { AuthUser, Vehicle, VehicleCategory } from "@/types";

export function isAdmin(user: AuthUser): boolean {
  return user.role === "admin";
}

export function getAccessibleCategoryIds(user: AuthUser): string[] {
  if (isAdmin(user)) return [];
  return user.categoryIds;
}

export function filterCategoriesByAccess(
  categories: VehicleCategory[],
  user: AuthUser,
): VehicleCategory[] {
  if (isAdmin(user)) return categories;
  return categories.filter((c) => user.categoryIds.includes(c.id));
}

export function filterVehiclesByAccess(vehicles: Vehicle[], user: AuthUser): Vehicle[] {
  if (isAdmin(user)) return vehicles;
  return vehicles.filter((v) => user.categoryIds.includes(v.categoryId));
}

export function canAccessVehicle(vehicle: Vehicle, user: AuthUser): boolean {
  if (isAdmin(user)) return true;
  return user.categoryIds.includes(vehicle.categoryId);
}

export function canAccessCategory(categoryId: string, user: AuthUser): boolean {
  if (isAdmin(user)) return true;
  return user.categoryIds.includes(categoryId);
}
