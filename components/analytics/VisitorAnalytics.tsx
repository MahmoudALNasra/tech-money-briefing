"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { trackAnalyticsEvent } from "@/lib/analytics-client";

export function VisitorAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPath = useRef<string | null>(null);

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

  return null;
}
