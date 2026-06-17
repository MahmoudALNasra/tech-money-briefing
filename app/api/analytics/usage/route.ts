import { NextResponse } from "next/server";

import {
  ESTIMATED_COSTS_USD,
  SUBSCRIPTION_PRICE_USD,
  SUBSCRIPTION_TOKEN_GRANT
} from "@/lib/business-data-tokens";
import { getApiCreditUsage } from "@/lib/api-credit-usage";
import { isAnalyticsDashboardAccessGranted } from "@/lib/visitor-analytics";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UsageRow = {
  event_type: string;
  tokens_charged: number;
  estimated_cost_usd: number | string;
  user_id: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
};

type LedgerRow = {
  delta: number;
  reason: string;
  created_at: string;
};

type SearchRow = {
  category: string;
  location: string | null;
  center_label: string | null;
  visitor_country: string | null;
  visitor_region: string | null;
  visitor_city: string | null;
  radius_meters: number;
  result_count: number;
  total_available_estimate: number;
  paid_access: boolean;
  provider: string;
  result_names: string[] | null;
  created_at: string;
};

export async function GET(request: Request) {
  if (!(await isAnalyticsDashboardAccessGranted(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayStartIso = todayStart.toISOString();

  const [usageResult, searchResult, ledgerResult, walletResult, apiCreditAccounts] = await Promise.all([
    supabase
      .from("business_data_usage_events")
      .select("event_type, tokens_charged, estimated_cost_usd, user_id, metadata, created_at")
      .gte("created_at", todayStartIso)
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase
      .from("business_data_searches")
      .select(
        "category, location, center_label, visitor_country, visitor_region, visitor_city, radius_meters, result_count, total_available_estimate, paid_access, provider, result_names, created_at"
      )
      .gte("created_at", todayStartIso)
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase
      .from("business_data_token_ledger")
      .select("delta, reason, created_at")
      .gte("created_at", todayStartIso)
      .order("created_at", { ascending: false })
      .limit(2000),
    supabase.from("business_data_wallets").select("balance, lifetime_credited, lifetime_debited"),
    getApiCreditUsage()
  ]);

  if (usageResult.error || ledgerResult.error || walletResult.error) {
    return NextResponse.json({ error: "Failed to load usage analytics." }, { status: 500 });
  }

  const usageRows = (usageResult.data ?? []) as UsageRow[];
  const searchRows = (searchResult.data ?? []) as SearchRow[];
  const ledgerRows = (ledgerResult.data ?? []) as LedgerRow[];
  const wallets = walletResult.data ?? [];

  const eventCounts = new Map<string, number>();
  let totalEstimatedCost = 0;
  let tokensConsumed = 0;

  for (const row of usageRows) {
    eventCounts.set(row.event_type, (eventCounts.get(row.event_type) ?? 0) + 1);
    totalEstimatedCost += Number(row.estimated_cost_usd ?? 0);
    tokensConsumed += Number(row.tokens_charged ?? 0);
  }

  const categoryCounts = new Map<string, number>();
  const locationCounts = new Map<string, number>();
  const searchCounts = new Map<string, number>();

  const searchAnalyticsRows =
    searchRows.length > 0
      ? searchRows
      : usageRows
          .filter((row) => row.event_type === "preview_search")
          .map((row) => {
            const metadata = row.metadata ?? {};
            return {
              category: String(metadata.category ?? "").trim(),
              location: String(metadata.location ?? "").trim() || null,
              center_label: String(metadata.center_label ?? "").trim() || null,
              visitor_country: String(metadata.visitor_country ?? "").trim() || null,
              visitor_region: String(metadata.visitor_region ?? "").trim() || null,
              visitor_city: String(metadata.visitor_city ?? "").trim() || null,
              radius_meters: Number(metadata.radius_meters ?? 0),
              result_count: Number(metadata.result_count ?? 0),
              total_available_estimate: Number(metadata.total_available_estimate ?? 0),
              paid_access: Boolean(metadata.paid_access),
              provider: String(metadata.provider ?? "").trim(),
              result_names: Array.isArray(metadata.result_names)
                ? metadata.result_names
                    .map((name) => String(name ?? "").trim())
                    .filter(Boolean)
                    .slice(0, 5)
                : [],
              created_at: row.created_at
            } satisfies SearchRow;
          });

  for (const row of searchAnalyticsRows) {
    const category = String(row.category ?? "").trim();
    const location = String(row.center_label ?? row.location ?? "").trim();

    if (category) {
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    }

    if (location) {
      locationCounts.set(location, (locationCounts.get(location) ?? 0) + 1);
    }

    if (category || location) {
      const label = [category || "unknown category", location || "unknown location"].join(" in ");
      searchCounts.set(label, (searchCounts.get(label) ?? 0) + 1);
    }
  }

  const tokensIssued = ledgerRows
    .filter((row) => row.delta > 0)
    .reduce((sum, row) => sum + row.delta, 0);

  const creditEvents = ledgerRows.filter((row) => row.delta > 0).length;
  const estimatedRevenueUsd =
    creditEvents > 0 ? creditEvents * SUBSCRIPTION_PRICE_USD : 0;
  const estimatedMarginUsd =
    estimatedRevenueUsd > 0 ? estimatedRevenueUsd - totalEstimatedCost : 0;
  const estimatedMarginPct =
    estimatedRevenueUsd > 0 ? (estimatedMarginUsd / estimatedRevenueUsd) * 100 : 0;
  const freePreviews =
    searchRows.length > 0
      ? searchRows.length
      : eventCounts.get("preview_search") ?? 0;
  const freePreviewEstimatedCost = usageRows
    .filter((row) => row.event_type === "preview_search")
    .reduce((sum, row) => sum + Number(row.estimated_cost_usd ?? 0), 0);

  const totalBalanceRemaining = wallets.reduce(
    (sum, wallet) => sum + Number(wallet.balance ?? 0),
    0
  );

  const topEvents = [...eventCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
  const topSearchCategories = [...categoryCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
  const topSearchLocations = [...locationCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
  const topBusinessSearches = [...searchCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
  const recentBusinessSearches = searchAnalyticsRows.slice(0, 20).map((row) => {
    const resultNames = Array.isArray(row.result_names)
      ? row.result_names
          .map((name) => String(name ?? "").trim())
          .filter(Boolean)
          .slice(0, 5)
      : [];

    return {
      created_at: row.created_at,
      category: String(row.category ?? "").trim(),
      location: String(row.location ?? "").trim(),
      center_label: String(row.center_label ?? "").trim(),
      visitor_country: String(row.visitor_country ?? "").trim(),
      visitor_region: String(row.visitor_region ?? "").trim(),
      visitor_city: String(row.visitor_city ?? "").trim(),
      radius_meters: Number(row.radius_meters ?? 0),
      result_count: Number(row.result_count ?? 0),
      total_available_estimate: Number(row.total_available_estimate ?? 0),
      paid_access: Boolean(row.paid_access),
      provider: String(row.provider ?? "").trim(),
      result_names: resultNames
    };
  });

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    window_label: "today_utc",
    window_start: todayStartIso,
    subscription_price_usd: SUBSCRIPTION_PRICE_USD,
    subscription_token_grant: SUBSCRIPTION_TOKEN_GRANT,
    searches: freePreviews,
    free_previews: freePreviews,
    free_preview_estimated_api_cost_usd: Number(freePreviewEstimatedCost.toFixed(4)),
    exports: eventCounts.get("full_export") ?? 0,
    drive_uploads:
      (eventCounts.get("drive_upload_cached") ?? 0) +
      (eventCounts.get("drive_upload") ?? 0),
    tokens_issued: tokensIssued,
    tokens_consumed: tokensConsumed,
    tokens_remaining_total: totalBalanceRemaining,
    estimated_api_cost_usd: Number(totalEstimatedCost.toFixed(4)),
    estimated_revenue_usd: Number(estimatedRevenueUsd.toFixed(2)),
    estimated_margin_usd: Number(estimatedMarginUsd.toFixed(2)),
    estimated_margin_pct: Number(estimatedMarginPct.toFixed(1)),
    top_events: topEvents,
    top_search_categories: topSearchCategories,
    top_search_locations: topSearchLocations,
    top_business_searches: topBusinessSearches,
    recent_business_searches: recentBusinessSearches,
    unit_costs_usd: ESTIMATED_COSTS_USD,
    api_credit_accounts: apiCreditAccounts
  });
}
