"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MapCoordinate } from "@/types";
import { interpolateAlongRoute } from "@/lib/route-geometry";

export type RouteAnimationState = {
  coordinate: MapCoordinate;
  bearing: number;
  progress: number;
};

export function useRouteAnimation(
  route: MapCoordinate[],
  options: {
    enabled: boolean;
    durationMs: number;
    loop?: boolean;
    phaseOffset?: number;
  },
): RouteAnimationState | null {
  const { enabled, durationMs, loop = true, phaseOffset = 0 } = options;
  const [state, setState] = useState<RouteAnimationState | null>(null);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  const routeKey = useMemo(
    () => route.map((p) => `${p.lat},${p.lng}`).join("|"),
    [route],
  );

  useEffect(() => {
    if (!enabled || route.length < 2) {
      setState(null);
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      return;
    }

    startRef.current = performance.now() - phaseOffset;

    const tick = (now: number) => {
      let elapsed = now - startRef.current;
      if (loop) {
        elapsed %= durationMs;
      } else if (elapsed > durationMs) {
        elapsed = durationMs;
      }

      const progress = elapsed / durationMs;
      const interpolated = interpolateAlongRoute(route, progress);

      if (interpolated) {
        setState({
          coordinate: interpolated.coordinate,
          bearing: interpolated.bearing,
          progress,
        });
      }

      if (!loop && elapsed >= durationMs) {
        frameRef.current = null;
        return;
      }

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [durationMs, enabled, loop, phaseOffset, route, routeKey]);

  return state;
}
