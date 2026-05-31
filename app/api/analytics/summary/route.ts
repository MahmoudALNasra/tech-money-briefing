import { NextResponse } from "next/server";

import { isAnalyticsDashboardAuthorized } from "@/lib/visitor-analytics";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VisitorEventRow = {
  id: string;
  event_name: string;
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
};

function countBy<T extends string | null>(
  rows: T[],
  limit = 10
): Array<{ label: string; count: number }> {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const label = row?.trim() || "(unknown)";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function GET(request: Request) {
  if (!isAnalyticsDashboardAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const fiveMinutesAgo = new Date(now - 5 * 60 * 1000).toISOString();
  const thirtyMinutesAgo = new Date(now - 30 * 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("visitor_events")
    .select(
      "id, event_name, session_id, page_path, page_title, referrer, utm_source, utm_campaign, country, device_type, metadata, created_at"
    )
    .gte("created_at", twentyFourHoursAgo)
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) {
    console.error("Failed to load analytics summary", error);
    return NextResponse.json({ error: "Failed to load analytics." }, { status: 500 });
  }

  const rows = (data ?? []) as VisitorEventRow[];
  const recentRows = rows.filter((row) => row.created_at >= fiveMinutesAgo);
  const last30Rows = rows.filter((row) => row.created_at >= thirtyMinutesAgo);

  const activeSessions = new Set(
    recentRows.map((row) => row.session_id).filter(Boolean)
  );
  const pageViews30 = last30Rows.filter((row) => row.event_name === "page_view")
    .length;
  const pageViews24 = rows.filter((row) => row.event_name === "page_view").length;

  const topPages = countBy(
    recentRows
      .filter((row) => row.event_name === "page_view")
      .map((row) => row.page_path),
    8
  );

  const topReferrers = countBy(
    recentRows.map((row) => {
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
    recentRows
      .filter((row) => row.event_name !== "page_view" && row.event_name !== "session_ping")
      .map((row) => row.event_name),
    10
  );

  const topCountries = countBy(recentRows.map((row) => row.country), 8);

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    active_visitors_5m: activeSessions.size,
    page_views_30m: pageViews30,
    page_views_24h: pageViews24,
    top_pages: topPages,
    top_referrers: topReferrers,
    top_events: topEvents,
    top_countries: topCountries,
    recent_events: rows.slice(0, 40).map((row) => ({
      id: row.id,
      event_name: row.event_name,
      page_path: row.page_path,
      page_title: row.page_title,
      referrer: row.referrer,
      country: row.country,
      device_type: row.device_type,
      metadata: row.metadata ?? {},
      created_at: row.created_at
    }))
  });
}
