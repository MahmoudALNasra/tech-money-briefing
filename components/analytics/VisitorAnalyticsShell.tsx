"use client";

import { Suspense } from "react";

import { VisitorAnalytics as VisitorAnalyticsTracker } from "@/components/analytics/VisitorAnalytics";
import { HeatmapTracker } from "@/components/analytics/HeatmapTracker";

export function VisitorAnalytics() {
  return (
    <Suspense fallback={null}>
      <VisitorAnalyticsTracker />
      <HeatmapTracker />
    </Suspense>
  );
}
