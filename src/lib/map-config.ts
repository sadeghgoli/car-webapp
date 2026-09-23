/** Sabzevar municipality MapLibre tile service (geo.sabzevar.ir) */
export const SABZEVAR_MAP = {
  styleUrl: process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "/style.json",
  tileApiKey:
    process.env.NEXT_PUBLIC_MAP_TILE_KEY ??
    "pk_OLH4n87ddaRXbkFXZM_hWn9hTeoKqhRn",
  defaultCenter: [
    Number(process.env.NEXT_PUBLIC_MAP_CENTER_LNG ?? 57.6815),
    Number(process.env.NEXT_PUBLIC_MAP_CENTER_LAT ?? 36.2111),
  ] as [number, number],
  defaultZoom: Number(process.env.NEXT_PUBLIC_MAP_ZOOM ?? 13),
  pitch: 45,
  bearing: 0,
} as const;

export const OSRM_BASE_URL =
  process.env.OSRM_BASE_URL ?? "https://router.project-osrm.org";

export const FALLBACK_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "OpenStreetMap",
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
    },
  ],
} as const;

export function appendTileKey(url: string, key = SABZEVAR_MAP.tileApiKey): string {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}key=${key}`;
}
