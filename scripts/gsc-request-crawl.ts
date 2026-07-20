/**
 * Submit sitemap to GSC and inspect priority URLs for crawl/index status.
 * Usage: npm run gsc:request-crawl
 *        npm run gsc:request-crawl -- --skip-submit
 *
 * Note: Google's API can submit sitemaps and inspect URLs.
 * "Request indexing" still requires the Search Console UI (daily quota).
 */

import { TOP_COMPARE_SLUGS_BY_GSC } from "../lib/traffic-priorities";
import {
  inspectGscUrl,
  listGscSitemaps,
  submitGscSitemap
} from "../lib/google-search-console";
import { loadLocalEnv } from "../lib/load-env";
import { siteConfig } from "../lib/site";

loadLocalEnv();

const PRIORITY_ARTICLE_PATHS = [
  "/digital-marketing/google-analytics-data-delay-why-reports-lag-and-what-ga4-does-not-track",
  "/fintech/stripe-vs-paddle-for-saas-payments-tax-and-founder-tradeoffs",
  "/seo/how-to-use-a-keyword-cluster-tool-for-content-planning",
  "/seo/optimizing-your-website-for-ai-citation-essential-audit-strategies",
  "/seo/leveraging-google-s-lighthouse-for-enhanced-website-performance-and-seo",
  "/ai-tools/understanding-cyera-s-12b-valuation-implications-for-ai-tools-investors",
  "/startups/how-to-price-a-saas-product-a-practical-formula-for-founders"
] as const;

function absolute(path: string) {
  return `${siteConfig.url.replace(/\/$/, "")}${path}`;
}

async function main() {
  const skipSubmit = process.argv.includes("--skip-submit");
  const sitemapUrl = `${siteConfig.url.replace(/\/$/, "")}/sitemap.xml`;

  const result: Record<string, unknown> = {
    ok: true,
    sitemapUrl,
    submitted: false,
    submitError: null as string | null,
    sitemaps: [] as unknown[],
    inspections: [] as unknown[],
    requestIndexingInGscUi: [] as string[]
  };

  if (!skipSubmit) {
    try {
      await submitGscSitemap(sitemapUrl);
      result.submitted = true;
    } catch (error) {
      result.submitError =
        error instanceof Error ? error.message : String(error);
    }
  }

  try {
    result.sitemaps = await listGscSitemaps();
  } catch (error) {
    result.sitemapListError =
      error instanceof Error ? error.message : String(error);
  }

  const priorityUrls = [
    absolute("/"),
    absolute("/compare"),
    absolute("/others"),
    absolute("/ai-tools"),
    absolute("/seo"),
    ...TOP_COMPARE_SLUGS_BY_GSC.slice(0, 8).map((slug) =>
      absolute(`/compare/${slug}`)
    ),
    ...PRIORITY_ARTICLE_PATHS.map(absolute)
  ];

  result.requestIndexingInGscUi = priorityUrls;

  for (const url of priorityUrls.slice(0, 12)) {
    try {
      const inspection = await inspectGscUrl(url);
      const status = inspection?.indexStatusResult;

      result.inspections = [
        ...(result.inspections as unknown[]),
        {
          url,
          verdict: status?.verdict ?? null,
          coverageState: status?.coverageState ?? null,
          indexingState: status?.indexingState ?? null,
          robotsTxtState: status?.robotsTxtState ?? null,
          pageFetchState: status?.pageFetchState ?? null,
          lastCrawlTime: status?.lastCrawlTime ?? null,
          consoleLink: inspection?.inspectionResultLink ?? null
        }
      ];
    } catch (error) {
      result.inspections = [
        ...(result.inspections as unknown[]),
        {
          url,
          error: error instanceof Error ? error.message : String(error)
        }
      ];
    }
  }

  console.log(JSON.stringify(result, null, 2));

  if (result.submitError) {
    console.error(
      "\n[gsc-request-crawl] Sitemap submit needs write scope. In GSC UI: Sitemaps → submit sitemap.xml. Or re-run npm run gsc:oauth-token with write scope."
    );
  }

  console.error(
    "\n[gsc-request-crawl] Request indexing in GSC UI for the URLs listed under requestIndexingInGscUi (API cannot trigger indexing requests)."
  );
}

main().catch((error) => {
  console.error("[gsc-request-crawl] Failed", error);
  process.exitCode = 1;
});
