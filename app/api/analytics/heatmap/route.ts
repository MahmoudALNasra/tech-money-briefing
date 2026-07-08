import { NextResponse } from "next/server";

import {
  aggregateHeatmapPoints,
  heatmapWindowToIso,
  sanitizeHeatmapPoint,
  type HeatmapDeviceFilter,
  type HeatmapInteractionFilter,
  type HeatmapWindow
} from "@/lib/heatmap-analytics";
import {
  filterExcludedAnalyticsRows,
  isAnalyticsDashboardAccessGranted
} from "@/lib/visitor-analytics";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HeatmapEventRow = {
  metadata: { points?: unknown } | null;
  device_type: string | null;
  created_at: string;
  ip_hash: string | null;
};

function parseWindow(value: string | null): HeatmapWindow {
  if (value === "30m" || value === "7d" || value === "24h") {
    return value;
  }

  return "24h";
}

function parseDevice(value: string | null): HeatmapDeviceFilter {
  if (value === "mobile" || value === "tablet" || value === "desktop") {
    return value;
  }

  return "all";
}

function parseInteraction(value: string | null): HeatmapInteractionFilter {
  if (value === "clicks" || value === "cursor_stops") {
    return value;
  }

  return "all";
}

export async function GET(request: Request) {
  if (!(await isAnalyticsDashboardAccessGranted(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const pagePath = url.searchParams.get("page_path")?.trim();

  if (!pagePath) {
    return NextResponse.json({ error: "page_path is required." }, { status: 400 });
  }

  const window = parseWindow(url.searchParams.get("window"));
  const device = parseDevice(url.searchParams.get("device"));
  const interaction = parseInteraction(url.searchParams.get("interaction"));
  const since = heatmapWindowToIso(window);

  let query = supabase
    .from("visitor_events")
    .select("metadata, device_type, created_at, ip_hash")
    .eq("event_name", "heatmap_batch")
    .eq("page_path", pagePath)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(800);

  if (device !== "all") {
    query = query.eq("device_type", device);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to load heatmap analytics", error);
    return NextResponse.json({ error: "Failed to load heatmap." }, { status: 500 });
  }

  const rows = filterExcludedAnalyticsRows((data ?? []) as HeatmapEventRow[]);
  const points = rows.flatMap((row) => {
    const rawPoints = row.metadata?.points;

    if (!Array.isArray(rawPoints)) {
      return [];
    }

    return rawPoints
      .map(sanitizeHeatmapPoint)
      .filter((point): point is NonNullable<typeof point> => Boolean(point));
  });

  const aggregated = aggregateHeatmapPoints(points, { interaction });
  const clickCount = points.filter((point) => point.type === "click").length;
  const cursorStopCount = points.filter((point) => point.type === "cursor_stop").length;

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    page_path: pagePath,
    window,
    device,
    interaction,
    batch_count: rows.length,
    click_count: clickCount,
    cursor_stop_count: cursorStopCount,
    ...aggregated
  });
}
