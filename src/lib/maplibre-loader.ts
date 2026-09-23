type MaplibreNamespace = typeof import("maplibre-gl");

declare global {
  interface Window {
    maplibregl?: MaplibreNamespace;
  }
}

let maplibreReady: Promise<MaplibreNamespace> | null = null;
let rtlPluginLoaded = false;

export function ensureLocalMapLibre(): Promise<MaplibreNamespace> {
  if (typeof window !== "undefined" && window.maplibregl) {
    return Promise.resolve(window.maplibregl);
  }

  if (maplibreReady) {
    return maplibreReady;
  }

  maplibreReady = new Promise((resolve, reject) => {
    const cssId = "local-maplibre-css";
    const scriptId = "local-maplibre-js";

    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "/js/maplibre-gl.min.css";
      document.head.appendChild(link);
    }

    const fail = (error: Error) => {
      maplibreReady = null;
      reject(error);
    };

    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
    const script = existingScript ?? document.createElement("script");
    const timer = window.setTimeout(() => {
      script.remove();
      fail(new Error("maplibre script timed out"));
    }, 12000);

    const finish = () => {
      window.clearTimeout(timer);
      if (!window.maplibregl) {
        script.remove();
        fail(new Error("maplibregl was not attached to window"));
        return;
      }

      if (!rtlPluginLoaded) {
        rtlPluginLoaded = true;
        window.maplibregl.setRTLTextPlugin?.("/js/mapbox-gl-rtl-text.js", true);
      }

      resolve(window.maplibregl);
    };

    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", () => {
      window.clearTimeout(timer);
      script.remove();
      fail(new Error("failed to load local maplibre script"));
    }, { once: true });

    if (!existingScript) {
      script.id = scriptId;
      script.src = "/js/maplibre-gl.min.js";
      script.async = true;
      document.body.appendChild(script);
    }
  });

  return maplibreReady;
}

export type { MaplibreNamespace };
