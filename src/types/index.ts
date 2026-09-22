export type VehicleStatus = "moving" | "stopped" | "offline";

export type UserRole = "viewer" | "admin";

export interface MapCoordinate {
  lat: number;
  lng: number;
}

export interface VehicleCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface CarLocation {
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  timestamp: string;
  /** Short operational note shown on the map tooltip (137 request, fire officer, …). */
  description: string;
}

export type VehiclePosition = CarLocation;

export interface Vehicle {
  id: string;
  title: string;
  plate: string;
  categoryId: string;
  status: VehicleStatus;
  origin: MapCoordinate;
  destination: MapCoordinate;
  position: CarLocation;
  connectionStatus: "online" | "offline";
  lastMovementAt: string;
}

export interface VehicleDetail extends Vehicle {
  categoryName: string;
  driverName?: string;
  unit?: string;
  positionHistory?: CarLocation[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  categoryIds: string[];
}

export interface SessionUser extends AuthUser {
  isAdmin: boolean;
}

export interface VehicleRoute {
  vehicleId: string;
  coordinates: MapCoordinate[];
  distanceMeters: number;
  durationMs: number;
  color: string;
}
