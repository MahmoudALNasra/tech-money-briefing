import { loadLocalEnv } from "../lib/load-env";
import { fetchAllGscQueryPageRows } from "../lib/google-search-console";
import {
  buildGscOpportunities,
  loadPublishedArticleRefs,
  matchArticleFromPage
} from "../lib/gsc-seo";

loadLocalEnv();

function getNumberArg(name: string, fallback: number) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  const parsed = Number(arg?.slice(prefix.length));

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function run() {
  const days = getNumberArg("days", Number(process.env.GSC_LOOKBACK_DAYS ?? 28));
  const minImpressions = Number(process.env.GSC_MIN_IMPRESSIONS ?? 15);

  const [rows, articles] = await Promise.all([
    fetchAllGscQueryPageRows({ days }),
    loadPublishedArticleRefs()
  ]);

  const withQuery = rows.filter((row) => row.query);
  const aboveMin = withQuery.filter((row) => row.impressions >= minImpressions);
  const matchedArticles = aboveMin.filter((row) =>
    matchArticleFromPage(row.page, articles)
  );
  const opportunities = buildGscOpportunities(rows, articles);

  const topQueries = [...withQuery]
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 20)
    .map((row) => ({
      query: row.query,
      impressions: row.impressions,
      clicks: row.clicks,
      position: Number(row.position.toFixed(1)),
      page: row.page?.slice(0, 80),
      matchedArticle: Boolean(matchArticleFromPage(row.page, articles))
    }));

  console.log(
    JSON.stringify(
      {
        days,
        config: {
          siteUrl: process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL,
          minImpressions,
          minPosition: process.env.GSC_MIN_IMPROVE_POSITION ?? 4,
          maxPosition: process.env.GSC_MAX_IMPROVE_POSITION ?? 35,
          publishedArticles: articles.length
        },
        raw: {
          totalRows: rows.length,
          rowsWithQuery: withQuery.length,
          rowsAboveMinImpressions: aboveMin.length,
          rowsMatchingPublishedArticle: matchedArticles.length
        },
        opportunities: opportunities.length,
        topQueriesByImpressions: topQueries
      },
      null,
      2
    )
  );
}

run().catch((error) => {
  console.error("[gsc-stats] Failed", error);
  process.exitCode = 1;
});
