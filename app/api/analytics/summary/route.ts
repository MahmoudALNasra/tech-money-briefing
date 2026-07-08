import { NextResponse } from "next/server";

import {
  countBy,
  countLandingPagesByPath,
  countPageViewsByPath,
  formatAnalyticsPagePath
} from "@/lib/analytics-summary";
import { computeSessionDurationStats } from "@/lib/session-duration";
import {
  filterExcludedAnalyticsRows,
  isAnalyticsDashboardAccessGranted
} from "@/lib/visitor-analytics";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VisitorEventRow = {
  id: string;
  event_name: string;
  visitor_id: string;
  session_id: string;
  page_path: string | null;
  page_title: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  country: string | null;
  device_type: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  ip_hash: string | null;
};

export async function GET(request: Request) {
  if (!(await isAnalyticsDashboardAccessGranted(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const fiveMinutesAgo = new Date(now - 5 * 60 * 1000).toISOString();
  const thirtyMinutesAgo = new Date(now - 30 * 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("visitor_events")
    .select(
      "id, event_name, visitor_id, session_id, page_path, page_title, referrer, utm_source, utm_campaign, country, device_type, metadata, created_at, ip_hash"
    )
    .gte("created_at", twentyFourHoursAgo)
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) {
    console.error("Failed to load analytics summary", error);
    return NextResponse.json({ error: "Failed to load analytics." }, { status: 500 });
  }

  const rows = filterExcludedAnalyticsRows((data ?? []) as VisitorEventRow[]);
  const recentRows = rows.filter((row) => row.created_at >= fiveMinutesAgo);
  const last30Rows = rows.filter((row) => row.created_at >= thirtyMinutesAgo);

  const activeSessions = new Set(
    recentRows.map((row) => row.session_id).filter(Boolean)
  );
  const pageViews30 = last30Rows.filter((row) => row.event_name === "page_view")
    .length;
  const pageViews24 = rows.filter((row) => row.event_name === "page_view").length;
  const uniqueVisitors24h = new Set(
    rows.map((row) => row.visitor_id).filter(Boolean)
  ).size;

  const topPages = countPageViewsByPath(last30Rows, 8);
  const topLandingPages = countLandingPagesByPath(last30Rows, 8);

  const topReferrers = countBy(
    last30Rows.map((row) => {
      if (row.utm_source) {
        return row.utm_campaign
          ? `${row.utm_source} / ${row.utm_campaign}`
          : row.utm_source;
      }

      if (!row.referrer) {
        return "direct";
      }

      try {
        return new URL(row.referrer).hostname;
      } catch {
        return row.referrer;
      }
    }),
    8
  );

  const topEvents = countBy(
    last30Rows
      .filter(
        (row) =>
          row.event_name !== "page_view" &&
          row.event_name !== "session_ping" &&
          row.event_name !== "session_end" &&
          row.event_name !== "heatmap_batch"
      )
      .map((row) => row.event_name),
    10
  );

  const topCountries = countBy(last30Rows.map((row) => row.country), 8);
  const sessionDuration30m = computeSessionDurationStats(last30Rows);
  const sessionDuration24h = computeSessionDurationStats(rows);
  const recentEvents = rows
    .filter(
      (row) =>
        row.event_name !== "session_ping" && row.event_name !== "heatmap_batch"
    )
    .slice(0, 40);

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    active_visitors_5m: activeSessions.size,
    page_views_30m: pageViews30,
    page_views_24h: pageViews24,
    unique_visitors_24h: uniqueVisitors24h,
    session_duration_30m: sessionDuration30m,
    session_duration_24h: sessionDuration24h,
    top_pages: topPages,
    top_landing_pages: topLandingPages,
    top_referrers: topReferrers,
    top_events: topEvents,
    top_countries: topCountries,
    recent_events: recentEvents.map((row) => ({
      id: row.id,
      event_name: row.event_name,
      page_path: row.page_path ? formatAnalyticsPagePath(row.page_path) : row.page_path,
      page_title: row.page_title,
      referrer: row.referrer,
      country: row.country,
      device_type: row.device_type,
      metadata: row.metadata ?? {},
      created_at: row.created_at
    }))
  });
}
