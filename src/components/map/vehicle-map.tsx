"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Vehicle, VehicleCategory, VehicleRoute } from "@/types";
import { useDashboardStore, filterVehiclesByLayers } from "@/stores/dashboard-store";
import { useVehicleRoutes } from "@/hooks/use-vehicle-routes";
import { ensureLocalMapLibre, type MaplibreNamespace } from "@/lib/maplibre-loader";
import { SABZEVAR_MAP, FALLBACK_STYLE, appendTileKey } from "@/lib/map-config";
import { interpolateAlongRoute } from "@/lib/route-geometry";
import { escapeHtml, getStatusLabel } from "@/lib/utils";

type MapInstance = InstanceType<MaplibreNamespace["Map"]>;
type MarkerInstance = InstanceType<MaplibreNamespace["Marker"]>;

const ROUTES_SOURCE = "vehicle-routes";
const ROUTES_LAYER = "vehicle-routes-line";
const ENDPOINTS_SOURCE = "route-endpoints";

function hashPhase(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 1000;
  }
  return (hash / 1000) * 12000;
}

const CAR_ICON_URL = "/car.png";
const TOOLTIP_OFFSET: [number, number] = [0, -42];
const TOOLTIP_OFFSET_SELECTED: [number, number] = [0, -54];

type VehicleMarkerEntry = {
  marker: MarkerInstance;
  tooltipMarker: MarkerInstance;
  icon: HTMLImageElement;
  rotator: HTMLDivElement;
  tooltip: HTMLDivElement;
};

function statusTooltipClass(status: Vehicle["status"], isSelected: boolean) {
  const statusClass =
    status === "moving" ? "is-moving" : status === "stopped" ? "is-stopped" : "is-offline";
  return `vehicle-status-tooltip ${statusClass}${isSelected ? " is-selected" : ""}`;
}

function fillVehicleTooltip(tooltip: HTMLDivElement, vehicle: Vehicle, isSelected: boolean) {
  const description = vehicle.position.description?.trim() ?? "";
  const renderKey = `${vehicle.status}|${isSelected}|${description}`;
  if (tooltip.dataset.renderKey === renderKey) return;

  tooltip.dataset.renderKey = renderKey;
  tooltip.className = statusTooltipClass(vehicle.status, isSelected);
  tooltip.innerHTML = `
    <div class="vehicle-status-tooltip-status">${escapeHtml(getStatusLabel(vehicle.status))}</div>
    ${description ? `<div class="vehicle-status-tooltip-desc">${escapeHtml(description)}</div>` : ""}
  `;
}

function createVehicleIconElements(vehicle: Vehicle, isSelected: boolean, bearing = 0) {
  const wrapper = document.createElement("div");
  wrapper.className = "vehicle-marker-wrapper";

  const rotator = document.createElement("div");
  rotator.className = "vehicle-marker-rotator";

  const icon = document.createElement("img");
  icon.src = CAR_ICON_URL;
  icon.alt = vehicle.title;
  icon.draggable = false;
  applyVehicleIconStyles(icon, rotator, vehicle.status, isSelected, bearing);

  rotator.appendChild(icon);
  wrapper.appendChild(rotator);
  return { wrapper, icon, rotator };
}

function applyVehicleIconStyles(
  icon: HTMLImageElement,
  rotator: HTMLDivElement,
  status: Vehicle["status"],
  isSelected: boolean,
  bearing: number,
) {
  const size = isSelected ? 48 : 36;

  icon.className = `vehicle-map-marker${isSelected ? " is-selected" : ""}${status === "moving" ? " vehicle-marker-pulse" : ""}`;
  icon.style.width = `${size}px`;
  icon.style.height = "auto";
  icon.style.opacity = status === "offline" ? "0.45" : "1";
  icon.style.cursor = "pointer";
  icon.style.filter = isSelected
    ? "drop-shadow(0 0 6px #1e40af)"
    : "drop-shadow(0 2px 4px rgba(0,0,0,0.4))";
  icon.style.pointerEvents = "auto";
  rotator.style.transform = `rotate(${bearing}deg)`;
}

function createEndpointElement(kind: "origin" | "destination") {
  const el = document.createElement("div");
  const color = kind === "origin" ? "#16a34a" : "#dc2626";
  el.style.cssText = `
    width: 14px;
    height: 14px;
    background: ${color};
    border: 2px solid white;
    border-radius: 50%;
    box-shadow: 0 1px 4px rgba(0,0,0,0.25);
  `;
  return el;
}

function buildRoutesGeoJson(routes: VehicleRoute[], visibleIds: Set<string>) {
  return {
    type: "FeatureCollection" as const,
    features: routes
      .filter((r) => visibleIds.has(r.vehicleId))
      .map((route) => ({
        type: "Feature" as const,
        properties: {
          vehicleId: route.vehicleId,
          color: route.color,
        },
        geometry: {
          type: "LineString" as const,
          coordinates: route.coordinates.map((c) => [c.lng, c.lat]),
        },
      })),
  };
}

function buildEndpointsGeoJson(vehicles: Vehicle[], visibleIds: Set<string>) {
  return {
    type: "FeatureCollection" as const,
    features: vehicles
      .filter((v) => visibleIds.has(v.id))
      .flatMap((vehicle) => [
        {
          type: "Feature" as const,
          properties: { kind: "origin", vehicleId: vehicle.id },
          geometry: {
            type: "Point" as const,
            coordinates: [vehicle.origin.lng, vehicle.origin.lat],
          },
        },
        {
          type: "Feature" as const,
          properties: { kind: "destination", vehicleId: vehicle.id },
          geometry: {
            type: "Point" as const,
            coordinates: [vehicle.destination.lng, vehicle.destination.lat],
          },
        },
      ]),
  };
}

export function VehicleMap({
  vehicles,
  categories,
}: {
  vehicles: Vehicle[];
  categories: VehicleCategory[];
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const maplibreRef = useRef<MaplibreNamespace | null>(null);
  const vehicleMarkersRef = useRef<Map<string, VehicleMarkerEntry>>(new Map());
  const endpointMarkersRef = useRef<MarkerInstance[]>([]);
  const fallbackAppliedRef = useRef(false);
  const readyRef = useRef(false);
  const animationRef = useRef<number | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const activeLayerIds = useDashboardStore((s) => s.activeLayerIds);
  const selectedVehicleId = useDashboardStore((s) => s.selectedVehicleId);
  const selectVehicle = useDashboardStore((s) => s.selectVehicle);

  const filteredVehicles = useMemo(
    () => filterVehiclesByLayers(vehicles, activeLayerIds),
    [vehicles, activeLayerIds],
  );

  const visibleIds = useMemo(
    () => new Set(filteredVehicles.map((v) => v.id)),
    [filteredVehicles],
  );

  const { routes, loading: routesLoading } = useVehicleRoutes(filteredVehicles, categories);

  const routeMap = useMemo(
    () => new Map(routes.map((r) => [r.vehicleId, r])),
    [routes],
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let disposed = false;
    let fallbackTimer: number | undefined;

    void ensureLocalMapLibre()
      .then((maplibregl) => {
        if (!mapContainerRef.current || disposed || mapRef.current) return;

        maplibreRef.current = maplibregl;

        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: SABZEVAR_MAP.styleUrl,
          center: SABZEVAR_MAP.defaultCenter,
          zoom: SABZEVAR_MAP.defaultZoom,
          pitch: SABZEVAR_MAP.pitch,
          bearing: SABZEVAR_MAP.bearing,
          attributionControl: false,
          dragRotate: false,
          touchPitch: false,
          transformRequest: (url: string, resourceType?: string) => {
            if (resourceType === "Tile") {
              return { url: appendTileKey(url) };
            }
            return { url };
          },
        });

        mapRef.current = map;
        map.addControl(new maplibregl.NavigationControl(), "top-left");

        const switchToFallback = () => {
          if (fallbackAppliedRef.current || disposed) return;
          fallbackAppliedRef.current = true;
          map.setStyle(FALLBACK_STYLE as never);
        };

        fallbackTimer = window.setTimeout(() => {
          if (!disposed && !readyRef.current) switchToFallback();
        }, 5000);

        map.on("load", () => {
          if (disposed) return;
          if (fallbackTimer) window.clearTimeout(fallbackTimer);
          readyRef.current = true;

          map.addSource(ROUTES_SOURCE, {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          });

          map.addLayer({
            id: ROUTES_LAYER,
            type: "line",
            source: ROUTES_SOURCE,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": ["get", "color"],
              "line-width": 4,
              "line-opacity": 0.75,
            },
          });

          map.addSource(ENDPOINTS_SOURCE, {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          });

          setMapReady(true);
        });

        map.on("error", (error) => {
          const errorText = String((error as { error?: unknown }).error ?? "");
          if (
            !fallbackAppliedRef.current &&
            (errorText.includes("AJAXError") ||
              errorText.includes("sprite") ||
              errorText.includes("could not be loaded"))
          ) {
            switchToFallback();
          }
        });
      })
      .catch(console.error);

    return () => {
      disposed = true;
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      vehicleMarkersRef.current.forEach((entry) => {
        entry.marker.remove();
        entry.tooltipMarker?.remove();
      });
      endpointMarkersRef.current.forEach((m) => m.remove());
      mapRef.current?.remove();
      mapRef.current = null;
      readyRef.current = false;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const routesSource = map.getSource(ROUTES_SOURCE) as import("maplibre-gl").GeoJSONSource | undefined;
    routesSource?.setData(buildRoutesGeoJson(routes, visibleIds));

    const endpointsSource = map.getSource(ENDPOINTS_SOURCE) as import("maplibre-gl").GeoJSONSource | undefined;
    endpointsSource?.setData(buildEndpointsGeoJson(filteredVehicles, visibleIds));
  }, [mapReady, routes, filteredVehicles, visibleIds]);

  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = maplibreRef.current;
    if (!map || !maplibregl || !mapReady) return;

    endpointMarkersRef.current.forEach((m) => m.remove());
    endpointMarkersRef.current = [];

    filteredVehicles.forEach((vehicle) => {
      const originMarker = new maplibregl.Marker({
        element: createEndpointElement("origin"),
        anchor: "center",
      })
        .setLngLat([vehicle.origin.lng, vehicle.origin.lat])
        .addTo(map);

      const destMarker = new maplibregl.Marker({
        element: createEndpointElement("destination"),
        anchor: "center",
      })
        .setLngLat([vehicle.destination.lng, vehicle.destination.lat])
        .addTo(map);

      endpointMarkersRef.current.push(originMarker, destMarker);
    });
  }, [filteredVehicles, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = maplibreRef.current;
    if (!map || !maplibregl || !mapReady || routesLoading) return;

    const existingIds = new Set(vehicleMarkersRef.current.keys());
    const neededIds = new Set(filteredVehicles.map((v) => v.id));

    existingIds.forEach((id) => {
      if (!neededIds.has(id)) {
        const entry = vehicleMarkersRef.current.get(id);
        entry?.marker.remove();
        entry?.tooltipMarker.remove();
        vehicleMarkersRef.current.delete(id);
      }
    });

    filteredVehicles.forEach((vehicle) => {
      const existing = vehicleMarkersRef.current.get(vehicle.id);
      const isSelected = vehicle.id === selectedVehicleId;

      if (existing) {
        fillVehicleTooltip(existing.tooltip, vehicle, isSelected);
        existing.tooltipMarker.setOffset(isSelected ? TOOLTIP_OFFSET_SELECTED : TOOLTIP_OFFSET);
        return;
      }

      const { wrapper, icon, rotator } = createVehicleIconElements(vehicle, isSelected);
      const tooltipWrap = document.createElement("div");
      tooltipWrap.className = "vehicle-tooltip-marker";
      const tooltip = document.createElement("div");
      fillVehicleTooltip(tooltip, vehicle, isSelected);
      tooltipWrap.appendChild(tooltip);

      wrapper.addEventListener("click", (e) => {
        e.stopPropagation();
        selectVehicle(vehicle.id);
      });

      const marker = new maplibregl.Marker({
        element: wrapper,
        anchor: "center",
        pitchAlignment: "viewport",
        rotationAlignment: "viewport",
      })
        .setLngLat([vehicle.origin.lng, vehicle.origin.lat])
        .addTo(map);

      const tooltipMarker = new maplibregl.Marker({
        element: tooltipWrap,
        anchor: "bottom",
        offset: isSelected ? TOOLTIP_OFFSET_SELECTED : TOOLTIP_OFFSET,
        pitchAlignment: "viewport",
        rotationAlignment: "viewport",
      })
        .setLngLat([vehicle.origin.lng, vehicle.origin.lat])
        .addTo(map);

      vehicleMarkersRef.current.set(vehicle.id, { marker, tooltipMarker, icon, rotator, tooltip });
    });
  }, [
    filteredVehicles,
    mapReady,
    routesLoading,
    selectVehicle,
    selectedVehicleId,
  ]);

  useEffect(() => {
    if (!mapReady || routesLoading) return;

    const tick = (now: number) => {
      filteredVehicles.forEach((vehicle) => {
        const entry = vehicleMarkersRef.current.get(vehicle.id);
        const route = routeMap.get(vehicle.id);
        const isSelected = vehicle.id === selectedVehicleId;

        if (!entry) return;

        const { marker, tooltipMarker, icon, rotator, tooltip } = entry;

        let lngLat: [number, number];
        let bearing = 0;

        if (vehicle.status === "moving" && route && route.coordinates.length >= 2) {
          const phase = hashPhase(vehicle.id);
          const elapsed = (now + phase) % route.durationMs;
          const progress = elapsed / route.durationMs;
          const interpolated = interpolateAlongRoute(route.coordinates, progress);

          if (interpolated) {
            lngLat = [interpolated.coordinate.lng, interpolated.coordinate.lat];
            bearing = interpolated.bearing;
          } else {
            lngLat = [vehicle.origin.lng, vehicle.origin.lat];
          }
        } else {
          lngLat = [vehicle.origin.lng, vehicle.origin.lat];
        }

        marker.setLngLat(lngLat);
        tooltipMarker.setLngLat(lngLat);
        tooltipMarker.setOffset(isSelected ? TOOLTIP_OFFSET_SELECTED : TOOLTIP_OFFSET);

        applyVehicleIconStyles(icon, rotator, vehicle.status, isSelected, bearing);
        fillVehicleTooltip(tooltip, vehicle, isSelected);
      });

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [
    filteredVehicles,
    mapReady,
    routeMap,
    routesLoading,
    selectedVehicleId,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !selectedVehicleId) return;

    const vehicle = filteredVehicles.find((v) => v.id === selectedVehicleId);
    if (!vehicle) return;

    const current = vehicleMarkersRef.current.get(vehicle.id)?.marker.getLngLat();

    map.flyTo({
      center: current ? [current.lng, current.lat] : [vehicle.origin.lng, vehicle.origin.lat],
      zoom: 15,
      essential: true,
    });
  }, [selectedVehicleId, filteredVehicles, mapReady]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full" />
      {(!mapReady || routesLoading) && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="mt-3 text-sm text-slate-500">
              {!mapReady ? "در حال بارگذاری نقشه سبزوار..." : "در حال محاسبه مسیرها..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
