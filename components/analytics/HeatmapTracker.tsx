"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ensureAnalyticsEligibility } from "@/lib/analytics-client";
import {
  flushHeatmapBatch,
  getHeatmapCursorStopDelayMs,
  recordHeatmapClick,
  recordHeatmapCursorStop,
  shouldTrackHeatmapOnPath
} from "@/lib/heatmap-client";

export function HeatmapTracker() {
  const pathname = usePathname();
  const [trackingAllowed, setTrackingAllowed] = useState(false);
  const trackingAllowedRef = useRef(false);

  useEffect(() => {
    trackingAllowedRef.current = trackingAllowed;
  }, [trackingAllowed]);

  useEffect(() => {
    let cancelled = false;

    void ensureAnalyticsEligibility().then((excluded) => {
      if (!cancelled) {
        setTrackingAllowed(!excluded);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!trackingAllowed || !shouldTrackHeatmapOnPath(pathname || "/")) {
      return;
    }

    let lastX = 0;
    let lastY = 0;
    let hasMoved = false;
    let stopTimer: number | null = null;

    const clearStopTimer = () => {
      if (stopTimer !== null) {
        window.clearTimeout(stopTimer);
        stopTimer = null;
      }
    };

    const scheduleCursorStop = () => {
      clearStopTimer();
      stopTimer = window.setTimeout(() => {
        if (!hasMoved || !trackingAllowedRef.current) {
          return;
        }

        recordHeatmapCursorStop(lastX, lastY);
        hasMoved = false;
      }, getHeatmapCursorStopDelayMs());
    };

    const onClick = (event: MouseEvent) => {
      if (!trackingAllowedRef.current) {
        return;
      }

      recordHeatmapClick(event);
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!trackingAllowedRef.current) {
        return;
      }

      if (event.clientX !== lastX || event.clientY !== lastY) {
        lastX = event.clientX;
        lastY = event.clientY;
        hasMoved = true;
        scheduleCursorStop();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushHeatmapBatch();
      }
    };

    const onPageHide = () => {
      flushHeatmapBatch();
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      clearStopTimer();
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      flushHeatmapBatch();
    };
  }, [pathname, trackingAllowed]);

  return null;
}
