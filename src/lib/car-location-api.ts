import { backendHttpRequest } from "@/lib/backend-http";
import type { CarLocation, MapCoordinate, Vehicle, VehicleDetail, VehicleStatus } from "@/types";

const DEFAULT_CAR_LOCATION_API_URL = "https://apiweb-carlocation.sabzevar.ir";
const DEFAULT_CAR_LOCATION_API_KEY = "dev-internal-key-137";

const OFFLINE_AFTER_MS = 5 * 60 * 1000;

type ApiVehicle = {
  id: string;
  plateNumber: string;
  chassisNumber?: string;
  color?: string | null;
  vehicleType: string;
  relatedGroup: string;
  isActive: boolean;
  createdAtUtc: string;
};

type LiveDevice = {
  deviceId: string;
  deviceCode: string;
  plateNumber?: string | null;
  vehicleId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  lastRecordedAtUtc?: string | null;
  lastReceivedAtUtc?: string | null;
  speedKmh?: number | null;
};

type MonitorSummary = {
  liveDevices?: LiveDevice[];
};

type LocationRow = {
  latitude: number;
  longitude: number;
  recordedAtUtc: string;
  receivedAtUtc: string;
  speedKmh?: number | null;
};

function carLocationBaseUrl() {
  return (process.env.CAR_LOCATION_API_URL || DEFAULT_CAR_LOCATION_API_URL).replace(/\/$/, "");
}

function carLocationApiKey() {
  return process.env.CAR_LOCATION_API_KEY || DEFAULT_CAR_LOCATION_API_KEY;
}

async function carLocationRequest<T>(path: string): Promise<T> {
  const url = `${carLocationBaseUrl()}${path.startsWith("/") ? "" : "/"}${path}`;
  const response = await backendHttpRequest({
    url,
    headers: {
      "X-Api-Key": carLocationApiKey(),
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const message =
      response.data && typeof response.data === "object" && "message" in response.data
        ? String((response.data as { message?: string }).message)
        : `HTTP ${response.status}`;
    throw new Error(message);
  }

  return response.data as T;
}

export function mapCategoryId(relatedGroup: string, vehicleType: string): string {
  const key = `${relatedGroup} ${vehicleType}`.toLowerCase();
  if (key.includes("137") || key.includes("شهر")) return "137";
  if (key.includes("transport") || key.includes("حمل") || key.includes("اتوبوس")) return "transport";
  if (key.includes("fire") || key.includes("آتش")) return "fire";
  if (key.includes("green") || key.includes("فضای") || key.includes("سبز")) return "green-space";
  if (key.includes("service") || key.includes("خدمات")) return "city-services";
  return "137";
}

function defaultCoordinate(): MapCoordinate {
  const lat = Number(process.env.NEXT_PUBLIC_MAP_CENTER_LAT ?? 36.2111);
  const lng = Number(process.env.NEXT_PUBLIC_MAP_CENTER_LNG ?? 57.6815);
  return { lat, lng };
}

function deriveStatus(speedKmh: number | null | undefined, lastReceivedAtUtc?: string | null): VehicleStatus {
  if (!lastReceivedAtUtc) return "offline";
  const age = Date.now() - new Date(lastReceivedAtUtc).getTime();
  if (age > OFFLINE_AFTER_MS) return "offline";
  if ((speedKmh ?? 0) > 2) return "moving";
  return "stopped";
}

function buildVehicleTitle(vehicle: ApiVehicle): string {
  const plate = vehicle.plateNumber?.trim();
  if (plate) return `${vehicle.relatedGroup || vehicle.vehicleType} — ${plate}`;
  return vehicle.vehicleType || "خودرو";
}

function mapToVehicle(vehicle: ApiVehicle, live?: LiveDevice | null): Vehicle {
  const fallback = defaultCoordinate();
  const lat = live?.latitude ?? fallback.lat;
  const lng = live?.longitude ?? fallback.lng;
  const speed = live?.speedKmh ?? 0;
  const lastAt = live?.lastReceivedAtUtc ?? live?.lastRecordedAtUtc ?? new Date().toISOString();
  const status = deriveStatus(speed, lastAt);
  const position: CarLocation = {
    lat,
    lng,
    speed,
    heading: 0,
    timestamp: lastAt,
    description: vehicle.relatedGroup || vehicle.vehicleType,
  };

  return {
    id: vehicle.id,
    title: buildVehicleTitle(vehicle),
    plate: vehicle.plateNumber,
    categoryId: mapCategoryId(vehicle.relatedGroup, vehicle.vehicleType),
    status,
    origin: { lat, lng },
    destination: { lat: lat + 0.002, lng: lng + 0.002 },
    position,
    connectionStatus: status === "offline" ? "offline" : "online",
    lastMovementAt: lastAt,
  };
}

export async function fetchVehiclesFromCarLocation(): Promise<Vehicle[]> {
  const [vehicles, summary] = await Promise.all([
    carLocationRequest<ApiVehicle[]>("/api/v1/vehicles"),
    carLocationRequest<MonitorSummary>("/api/v1/monitor/summary").catch(() => ({
      liveDevices: [] as LiveDevice[],
    })),
  ]);

  const liveByVehicle = new Map<string, LiveDevice>();
  for (const device of summary.liveDevices ?? []) {
    if (device.vehicleId) {
      liveByVehicle.set(device.vehicleId, device);
    }
  }

  return vehicles
    .filter((v) => v.isActive !== false)
    .map((v) => mapToVehicle(v, liveByVehicle.get(v.id) ?? null));
}

export async function fetchVehicleDetailFromCarLocation(id: string): Promise<VehicleDetail | null> {
  const [vehicle, latest, history] = await Promise.all([
    carLocationRequest<ApiVehicle>(`/api/v1/vehicles/${encodeURIComponent(id)}`).catch(() => null),
    carLocationRequest<LocationRow | null>(
      `/api/v1/locations/latest?vehicleId=${encodeURIComponent(id)}`,
    ).catch(() => null),
    carLocationRequest<LocationRow[]>(
      `/api/v1/locations?vehicleId=${encodeURIComponent(id)}&take=20`,
    ).catch(() => []),
  ]);

  if (!vehicle) return null;

  const live: LiveDevice | null = latest
    ? {
        deviceId: "",
        deviceCode: "",
        vehicleId: id,
        latitude: latest.latitude,
        longitude: latest.longitude,
        speedKmh: latest.speedKmh,
        lastReceivedAtUtc: latest.receivedAtUtc,
        lastRecordedAtUtc: latest.recordedAtUtc,
        plateNumber: vehicle.plateNumber,
      }
    : null;

  const mapped = mapToVehicle(vehicle, live);
  const positionHistory: CarLocation[] = (history ?? []).map((row) => ({
    lat: row.latitude,
    lng: row.longitude,
    speed: row.speedKmh ?? 0,
    heading: 0,
    timestamp: row.recordedAtUtc,
    description: vehicle.relatedGroup || vehicle.vehicleType,
  }));

  return {
    ...mapped,
    categoryName: vehicle.relatedGroup || vehicle.vehicleType,
    unit: vehicle.relatedGroup,
    positionHistory: positionHistory.length ? positionHistory : [mapped.position],
  };
}
