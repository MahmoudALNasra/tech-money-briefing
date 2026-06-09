import { NextResponse } from "next/server";

import {
  ESTIMATED_COSTS_USD,
  SUBSCRIPTION_PRICE_USD,
  SUBSCRIPTION_TOKEN_GRANT
} from "@/lib/business-data-tokens";
import { getApiCreditUsage } from "@/lib/api-credit-usage";
import { isAnalyticsDashboardAuthorized } from "@/lib/visitor-analytics";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UsageRow = {
  event_type: string;
  tokens_charged: number;
  estimated_cost_usd: number | string;
  user_id: string | null;
  created_at: string;
};

type LedgerRow = {
  delta: number;
  reason: string;
  created_at: string;
};

export async function GET(request: Request) {
  if (!isAnalyticsDashboardAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [usageResult, ledgerResult, walletResult, apiCreditAccounts] = await Promise.all([
    supabase
      .from("business_data_usage_events")
      .select("event_type, tokens_charged, estimated_cost_usd, user_id, created_at")
      .gte("created_at", twentyFourHoursAgo)
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase
      .from("business_data_token_ledger")
      .select("delta, reason, created_at")
      .gte("created_at", twentyFourHoursAgo)
      .order("created_at", { ascending: false })
      .limit(2000),
    supabase.from("business_data_wallets").select("balance, lifetime_credited, lifetime_debited"),
    getApiCreditUsage()
  ]);

  if (usageResult.error || ledgerResult.error || walletResult.error) {
    return NextResponse.json({ error: "Failed to load usage analytics." }, { status: 500 });
  }

  const usageRows = (usageResult.data ?? []) as UsageRow[];
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

  const tokensIssued = ledgerRows
    .filter((row) => row.delta > 0)
    .reduce((sum, row) => sum + row.delta, 0);

  const creditEvents = ledgerRows.filter((row) => row.delta > 0).length;
  const estimatedRevenueUsd =
    creditEvents > 0 ? creditEvents * SUBSCRIPTION_PRICE_USD : 0;
  const estimatedMarginUsd = estimatedRevenueUsd - totalEstimatedCost;
  const estimatedMarginPct =
    estimatedRevenueUsd > 0 ? (estimatedMarginUsd / estimatedRevenueUsd) * 100 : 0;

  const totalBalanceRemaining = wallets.reduce(
    (sum, wallet) => sum + Number(wallet.balance ?? 0),
    0
  );

  const topEvents = [...eventCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    window_hours: 24,
    subscription_price_usd: SUBSCRIPTION_PRICE_USD,
    subscription_token_grant: SUBSCRIPTION_TOKEN_GRANT,
    searches: eventCounts.get("preview_search") ?? 0,
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
    unit_costs_usd: ESTIMATED_COSTS_USD,
    api_credit_accounts: apiCreditAccounts
  });
}
