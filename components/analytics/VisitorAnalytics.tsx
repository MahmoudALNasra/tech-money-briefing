"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import {
  getAnalyticsSessionDurationSeconds,
  trackAnalyticsEvent
} from "@/lib/analytics-client";

export function VisitorAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPath = useRef<string | null>(null);
  const sessionEndSent = useRef(false);

  useEffect(() => {
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
  }, [pathname, searchParams]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      trackAnalyticsEvent({
        event: "session_ping",
        page_path: window.location.pathname,
        page_title: document.title
      });
    }, 30000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
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
  }, []);

  return null;
}
