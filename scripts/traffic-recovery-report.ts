/**
 * Traffic recovery priorities from GSC + live indexing checks.
 * Usage: npm run seo:traffic-recovery
 */

import { isAdsenseReviewMode, isAdsenseReviewSeoBlocked } from "../lib/adsense-readiness";
import { getComparisonBySlug } from "../lib/comparisons";
import { fetchAllGscQueryPageRows } from "../lib/google-search-console";
import { loadLocalEnv } from "../lib/load-env";
import { TOP_COMPARE_SLUGS_BY_GSC } from "../lib/traffic-priorities";
import { supabase } from "../lib/supabase";

loadLocalEnv();

async function main() {
  const rows = await fetchAllGscQueryPageRows({ days: 90 });
  const compareQueries = rows
    .filter((row) => row.page?.includes("/compare/"))
    .reduce<Map<string, { impressions: number; clicks: number; queries: string[] }>>(
      (map, row) => {
        const page = row.page!;
        const existing = map.get(page) ?? { impressions: 0, clicks: 0, queries: [] };

        existing.impressions += row.impressions;
        existing.clicks += row.clicks;

        if (row.query && !existing.queries.includes(row.query)) {
          existing.queries.push(row.query);
        }

        map.set(page, existing);
        return map;
      },
      new Map()
    );

  const topComparePages = [...compareQueries.entries()]
    .sort((left, right) => right[1].impressions - left[1].impressions)
    .slice(0, 15)
    .map(([page, stats]) => ({
      page,
      slug: page.replace(/^https?:\/\/[^/]+/, "").replace(/^\/compare\//, ""),
      ...stats
    }));

  const { count: publishedCount } = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  const indexingBlocked = isAdsenseReviewSeoBlocked();

  console.log(
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        review_mode: isAdsenseReviewMode(),
        compare_indexing_blocked: indexingBlocked,
        published_articles: publishedCount ?? 0,
        action_required: indexingBlocked
          ? "Set ADSENSE_REVIEW_MODE=false on Vercel Production and redeploy before expecting compare traffic to recover."
          : "Request indexing in GSC for top compare URLs below.",
        top_compare_pages: topComparePages,
        homepage_priority_slugs: TOP_COMPARE_SLUGS_BY_GSC,
        gsc_indexing_urls: topComparePages.slice(0, 10).map((entry) => entry.page),
        missing_compare_pages: TOP_COMPARE_SLUGS_BY_GSC.filter(
          (slug) => !getComparisonBySlug(slug)
        )
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("[traffic-recovery] Failed", error);
  process.exitCode = 1;
});
