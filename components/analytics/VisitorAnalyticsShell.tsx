"use client";

import { Suspense } from "react";

import { VisitorAnalytics as VisitorAnalyticsTracker } from "@/components/analytics/VisitorAnalytics";

export function VisitorAnalytics() {
  return (
    <Suspense fallback={null}>
      <VisitorAnalyticsTracker />
    </Suspense>
  );
}
