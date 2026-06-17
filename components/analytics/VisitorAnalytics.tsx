"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  ensureAnalyticsEligibility,
  getAnalyticsSessionDurationSeconds,
  trackAnalyticsEvent
} from "@/lib/analytics-client";

export function VisitorAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPath = useRef<string | null>(null);
  const pathnameRef = useRef(pathname);
  const sessionEndSent = useRef(false);
  const [trackingAllowed, setTrackingAllowed] = useState(false);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

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
    if (!trackingAllowed) {
      return;
    }

    const currentPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

    if (lastTrackedPath.current === currentPath) {
      return;
    }

    lastTrackedPath.current = currentPath;

    trackAnalyticsEvent({
      event: "page_view",
      page_path: pathname,
      page_title: document.title
    });
  }, [pathname, searchParams, trackingAllowed]);

  useEffect(() => {
    if (!trackingAllowed) {
      return;
    }

    const interval = window.setInterval(() => {
      trackAnalyticsEvent({
        event: "session_ping",
        page_path: pathnameRef.current || window.location.pathname,
        page_title: document.title
      });
    }, 30000);

    return () => window.clearInterval(interval);
  }, [trackingAllowed]);

  useEffect(() => {
    if (!trackingAllowed) {
      return;
    }

    function sendSessionEnd() {
      if (sessionEndSent.current || document.visibilityState === "visible") {
        return;
      }

      sessionEndSent.current = true;
      trackAnalyticsEvent({
        event: "session_end",
        page_path: window.location.pathname,
        page_title: document.title,
        metadata: {
          duration_seconds: getAnalyticsSessionDurationSeconds()
        }
      });
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        sendSessionEnd();
      }
    };

    window.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", sendSessionEnd);

    return () => {
      window.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", sendSessionEnd);
    };
  }, [trackingAllowed]);

  return null;
}
