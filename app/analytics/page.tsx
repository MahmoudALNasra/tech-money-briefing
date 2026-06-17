import { Suspense } from "react";

import { AnalyticsDashboard } from "@/app/analytics/AnalyticsDashboard";

function AnalyticsLandingFallback() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-lg items-center px-5 py-16">
      <div
        className="w-full rounded-[2rem] border border-stone-200 bg-white p-8 shadow-xl"
        data-surface="light"
      >
        <p className="text-xs font-black uppercase tracking-[0.22em] text-stone-500">
          Private dashboard
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-ink">
          Real-time visitor analytics
        </h1>
        <p className="mt-4 text-sm font-semibold text-stone-500">Loading dashboard...</p>
      </div>
    </main>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsLandingFallback />}>
      <AnalyticsDashboard />
    </Suspense>
  );
}
